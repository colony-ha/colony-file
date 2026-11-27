const SITE_ORIGIN = "https://colony-file.pages.dev";
const COOKIE = "colony_file_session";
const SESSION_DAYS = 14;
const ADMIN_EMAIL = "hanih9823@gmail.com";

const cors = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-File-Name, X-File-Size, X-Folder-Id",
  "Vary": "Origin"
};

function reply(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors, ...extra }
  });
}
const now = () => new Date().toISOString();
const random = (n = 32) => {
  const b = crypto.getRandomValues(new Uint8Array(n));
  return [...b].map(x => x.toString(16).padStart(2, "0")).join("");
};
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
async function digest(value) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}
async function passwordHash(password, salt = random(16)) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: Uint8Array.from(salt.match(/.{2}/g).map(x => parseInt(x, 16))), iterations: 100000, hash: "SHA-256" }, material, 256);
  return { hash: hex(bits), salt };
}
async function verifyPassword(password, salt, expected) {
  const result = await passwordHash(password, salt);
  return result.hash === expected;
}
function cookie(value, maxAge = SESSION_DAYS * 86400) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${maxAge}`;
}
function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`;
}
function getCookie(request) {
  const raw = request.headers.get("Cookie") || "";
  const item = raw.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="));
  return item ? item.slice(COOKIE.length + 1) : null;
}
async function createSession(env, userId) {
  const token = random(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)")
    .bind(crypto.randomUUID(), userId, await digest(token), expires).run();
  return token;
}
async function currentUser(request, env) {
  const token = getCookie(request);
  if (!token) return null;
  const row = await env.DB.prepare(`SELECT u.id,u.email,u.display_name,u.role,u.plan,u.storage_limit_bytes,u.storage_used_bytes,
    EXISTS(SELECT 1 FROM password_change_required p WHERE p.user_id=u.id) AS must_change_password
    FROM sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.status='active'`).bind(await digest(token), now()).first();
  return row || null;
}
async function ensurePaymentSettings(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`).run();
  await env.DB.prepare("INSERT OR IGNORE INTO app_settings (setting_key,setting_value) VALUES ('usd_dzd_rate','260')").run();
  await env.DB.prepare("INSERT OR IGNORE INTO app_settings (setting_key,setting_value) VALUES ('ccp_details','')").run();
  await env.DB.prepare("INSERT OR IGNORE INTO app_settings (setting_key,setting_value) VALUES ('cpa_details','')").run();
  await env.DB.prepare("INSERT OR IGNORE INTO app_settings (setting_key,setting_value) VALUES ('cepa_details','')").run();
}
async function paymentSettings(env) {
  const rows=await env.DB.prepare("SELECT setting_key,setting_value FROM app_settings").all();
  const values=Object.fromEntries((rows.results||[]).map(x=>[x.setting_key,x.setting_value]));
  return {usd_dzd_rate:Number(values.usd_dzd_rate||260),ccp_details:values.ccp_details||"",cpa_details:values.cpa_details||"",cepa_details:values.cepa_details||""};
}
async function ensureResetTable(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS password_reset_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
    requested_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    reviewed_at TEXT,
    reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    temporary_password_hash TEXT,
    temporary_password_salt TEXT
  )`).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_password_reset_status ON password_reset_requests(status,requested_at)").run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS password_change_required (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`).run();
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.headers.get("Origin") && request.headers.get("Origin") !== SITE_ORIGIN) return reply({ error: "Origin not allowed" }, 403);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    try {
      await ensureResetTable(env);
      await ensurePaymentSettings(env);
      if (url.pathname === "/" || url.pathname === "/health") {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        return reply({ service: "COLONY FILE API", status: "running", database: row?.ok === 1 ? "connected" : "unknown", storage: env.FILES ? "bound" : "not_bound" });
      }

      if (url.pathname === "/admin/bootstrap" && request.method === "POST") {
        if (!env.ADMIN_BOOTSTRAP_KEY) return reply({ error: "Admin setup is not configured." }, 503);
        const body = await request.json();
        const setupKey = String(body.setupKey || "");
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        if (setupKey.length < 32 || setupKey !== env.ADMIN_BOOTSTRAP_KEY) return reply({ error: "Invalid setup key." }, 403);
        if (email !== ADMIN_EMAIL) return reply({ error: "This email is not authorized for the super administrator." }, 403);
        if (password.length < 10 || password.length > 128) return reply({ error: "Password must be 10–128 characters." }, 400);
        const existingAdmin = await env.DB.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").first();
        if (existingAdmin) return reply({ error: "An administrator is already configured." }, 409);
        const existing = await env.DB.prepare("SELECT id,password_hash FROM users WHERE email=?").bind(ADMIN_EMAIL).first();
        if (existing) {
          if (!existing.password_hash || !existing.password_hash.includes(":")) return reply({ error: "Existing account has no password. Contact support for secure recovery." }, 409);
          const [oldSalt, oldHash] = existing.password_hash.split(":");
          if (!await verifyPassword(password, oldSalt, oldHash)) return reply({ error: "Use the existing account password to activate administrator access." }, 403);
          await env.DB.prepare("UPDATE users SET role='admin',updated_at=? WHERE id=?").bind(now(), existing.id).run();
          return reply({ ok: true, message: "Super administrator role activated. Sign in normally." });
        }
        const { hash, salt } = await passwordHash(password);
        const id = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO users (id,email,display_name,password_hash,auth_provider,role,plan,storage_limit_bytes) VALUES (?,?,? ,?,'email','admin','FREE',1073741824)")
          .bind(id, ADMIN_EMAIL, "COLONY FILE Administrator", `${salt}:${hash}`).run();
        return reply({ ok: true, message: "Super administrator account created. Sign in normally." }, 201);
      }

      if (url.pathname === "/auth/register" && request.method === "POST") {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const name = String(body.displayName || "").trim().slice(0, 80);
        const password = String(body.password || "");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply({ error: "Enter a valid email address." }, 400);
        if (password.length < 10 || password.length > 128) return reply({ error: "Password must be 10–128 characters." }, 400);
        const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
        if (exists) return reply({ error: "An account with this email already exists." }, 409);
        const { hash, salt } = await passwordHash(password);
        const id = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO users (id,email,display_name,password_hash,auth_provider,role,plan,storage_limit_bytes) VALUES (?,?,?,?, 'email','user','FREE',1073741824)")
          .bind(id, email, name || null, `${salt}:${hash}`).run();
        const token = await createSession(env, id);
        return reply({ ok: true, user: { id, email, display_name: name, role: "user", plan: "FREE", storage_limit_bytes: 1073741824, storage_used_bytes: 0, must_change_password: false } }, 201, { "Set-Cookie": cookie(token) });
      }

      if (url.pathname === "/auth/login" && request.method === "POST") {
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const user = await env.DB.prepare(`SELECT id,email,display_name,password_hash,auth_provider,status,role,plan,storage_limit_bytes,storage_used_bytes,
          EXISTS(SELECT 1 FROM password_change_required p WHERE p.user_id=users.id) AS must_change_password
          FROM users WHERE email=?`).bind(email).first();
        if (!user || user.status !== "active" || !user.password_hash || !user.password_hash.includes(":")) return reply({ error: "Invalid email or password." }, 401);
        const [salt, hash] = user.password_hash.split(":");
        if (!await verifyPassword(password, salt, hash)) return reply({ error: "Invalid email or password." }, 401);
        const token = await createSession(env, user.id);
        delete user.password_hash;
        return reply({ ok: true, user }, 200, { "Set-Cookie": cookie(token) });
      }

      if (url.pathname === "/auth/me" && request.method === "GET") {
        const user = await currentUser(request, env);
        return user ? reply({ user }) : reply({ user: null }, 401);
      }

      if (url.pathname === "/auth/change-password" && request.method === "POST") {
        const user = await currentUser(request, env);
        if (!user) return reply({ error: "Please sign in again." }, 401);
        const body = await request.json();
        const currentPassword = String(body.currentPassword || "");
        const newPassword = String(body.newPassword || "");
        if (newPassword.length < 10 || newPassword.length > 128) return reply({ error: "New password must be 10–128 characters." }, 400);
        const account = await env.DB.prepare("SELECT password_hash FROM users WHERE id=?").bind(user.id).first();
        if (!account?.password_hash || !account.password_hash.includes(":")) return reply({ error: "Password change is unavailable for this account." }, 400);
        const [oldSalt, oldHash] = account.password_hash.split(":");
        if (!await verifyPassword(currentPassword, oldSalt, oldHash)) return reply({ error: "Current password is incorrect." }, 400);
        const { hash, salt } = await passwordHash(newPassword);
        await env.DB.batch([
          env.DB.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?").bind(`${salt}:${hash}`, now(), user.id),
          env.DB.prepare("DELETE FROM password_change_required WHERE user_id=?").bind(user.id)
        ]);
        return reply({ ok: true, message: "Password updated successfully." });
      }

      if (url.pathname === "/auth/logout" && request.method === "POST") {
        const token = getCookie(request);
        if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await digest(token)).run();
        return reply({ ok: true }, 200, { "Set-Cookie": clearCookie() });
      }

      if (url.pathname === "/auth/password-reset-request" && request.method === "POST") {
        await ensureResetTable(env);
        const body = await request.json();
        const email = String(body.email || "").trim().toLowerCase();
        const user = await env.DB.prepare("SELECT id FROM users WHERE email=? AND status='active'").bind(email).first();
        if (user) {
          const pending = await env.DB.prepare("SELECT id FROM password_reset_requests WHERE user_id=? AND status='pending'").bind(user.id).first();
          if (!pending) await env.DB.prepare("INSERT INTO password_reset_requests (id,user_id) VALUES (?,?)").bind(crypto.randomUUID(), user.id).run();
        }
        return reply({ ok: true, message: "If the account exists, the request has been sent to the administrator." });
      }

      // Authenticated customer workspace: quota and file metadata are always read from D1.
      if (url.pathname === "/workspace" && request.method === "GET") {
        const user = await currentUser(request, env);
        if (!user) return reply({ error: "Please sign in." }, 401);
        const [folders, files] = await Promise.all([
          env.DB.prepare("SELECT id,name,parent_id,created_at FROM folders WHERE user_id=? AND parent_id IS NULL ORDER BY name COLLATE NOCASE").bind(user.id).all(),
          env.DB.prepare("SELECT id,original_name,mime_type,size_bytes,download_count,created_at,folder_id FROM files WHERE user_id=? AND folder_id IS NULL AND status='active' ORDER BY created_at DESC").bind(user.id).all()
        ]);
        return reply({ user, folders: folders.results, files: files.results });
      }

      if (url.pathname === "/folders" && request.method === "POST") {
        const user = await currentUser(request, env);
        if (!user) return reply({ error: "Please sign in." }, 401);
        const body = await request.json();
        const name = String(body.name || "").trim();
        const parentId = body.parentId ? String(body.parentId) : null;
        if (!name || name.length > 120 || (name.includes("/") || name.includes("\\") || name.includes(String.fromCharCode(0)))) return reply({ error: "Folder name must be 1–120 characters and cannot contain slashes." }, 400);
        if (parentId) {
          const parent = await env.DB.prepare("SELECT id FROM folders WHERE id=? AND user_id=?").bind(parentId, user.id).first();
          if (!parent) return reply({ error: "Parent folder not found." }, 404);
        }
        const id = crypto.randomUUID();
        try {
          await env.DB.prepare("INSERT INTO folders (id,user_id,parent_id,name) VALUES (?,?,?,?)").bind(id,user.id,parentId,name).run();
        } catch (error) {
          if (String(error.message).includes("UNIQUE")) return reply({ error: "A folder with this name already exists here." }, 409);
          throw error;
        }
        return reply({ ok: true, folder: { id, name, parent_id: parentId } }, 201);
      }

      if (url.pathname.startsWith("/folders/") && request.method === "GET") {
        const user = await currentUser(request, env);
        if (!user) return reply({ error: "Please sign in." }, 401);
        const folderId = url.pathname.split("/")[2];
        const folder = await env.DB.prepare("SELECT id,name,parent_id FROM folders WHERE id=? AND user_id=?").bind(folderId,user.id).first();
        if (!folder) return reply({ error: "Folder not found." }, 404);
        const [folders,files] = await Promise.all([
          env.DB.prepare("SELECT id,name,parent_id,created_at FROM folders WHERE user_id=? AND parent_id=? ORDER BY name COLLATE NOCASE").bind(user.id,folderId).all(),
          env.DB.prepare("SELECT id,original_name,mime_type,size_bytes,download_count,created_at,folder_id FROM files WHERE user_id=? AND folder_id=? AND status='active' ORDER BY created_at DESC").bind(user.id,folderId).all()
        ]);
        return reply({ folder, folders:folders.results, files:files.results });
      }

      if (url.pathname === "/files/upload" && request.method === "POST") {
        const user = await currentUser(request, env);
        if (!user) return reply({ error: "Please sign in." }, 401);
        const name = decodeURIComponent(request.headers.get("X-File-Name") || "file");
        const mime = request.headers.get("Content-Type") || "application/octet-stream";
        const size = Number(request.headers.get("X-File-Size") || request.headers.get("Content-Length") || 0);
        const folderId = request.headers.get("X-Folder-Id") || null;
        if (!name || name.length > 255 || /[\\0]/.test(name)) return reply({ error: "Invalid file name." }, 400);
        if (!Number.isSafeInteger(size) || size < 0 || size > 5 * 1024 * 1024 * 1024) return reply({ error: "Invalid file size." }, 400);
        if (!request.body) return reply({ error: "File content is missing." }, 400);
        if (folderId) {
          const folder = await env.DB.prepare("SELECT id FROM folders WHERE id=? AND user_id=?").bind(folderId,user.id).first();
          if (!folder) return reply({ error: "Destination folder not found." }, 404);
        }
        const reserve = await env.DB.prepare("UPDATE users SET storage_used_bytes=storage_used_bytes+? WHERE id=? AND status='active' AND storage_used_bytes+?<=storage_limit_bytes").bind(size,user.id,size).run();
        if (!reserve.meta?.changes) return reply({ error: "Storage limit exceeded. Upgrade your plan or free up space." }, 413);
        const id = crypto.randomUUID();
        const objectKey = user.id + "/" + id;
        try {
          const storedObject = await env.FILES.put(objectKey, request.body, { httpMetadata: { contentType: mime } });
          if (storedObject.size !== size) {
            await env.FILES.delete(objectKey);
            await env.DB.prepare("UPDATE users SET storage_used_bytes=MAX(0,storage_used_bytes-?) WHERE id=?").bind(size,user.id).run();
            return reply({ error: "Uploaded file size did not match the declared size. Please retry." }, 400);
          }
          await env.DB.prepare("INSERT INTO files (id,user_id,folder_id,object_key,original_name,mime_type,size_bytes) VALUES (?,?,?,?,?,?,?)")
            .bind(id,user.id,folderId,objectKey,name,mime,size).run();
        } catch (error) {
          await env.FILES.delete(objectKey).catch(()=>{});
          await env.DB.prepare("UPDATE users SET storage_used_bytes=MAX(0,storage_used_bytes-?) WHERE id=?").bind(size,user.id).run();
          throw error;
        }
        return reply({ ok:true, file:{id,original_name:name,mime_type:mime,size_bytes:size,folder_id:folderId} },201);
      }

      if (url.pathname === "/subscription" && request.method === "GET") {
        const user = await currentUser(request, env);
        if (!user) return reply({ error: "Please sign in." }, 401);
        const active = await env.DB.prepare("SELECT id,ends_at FROM subscriptions WHERE user_id=? AND status='active' ORDER BY created_at DESC LIMIT 1").bind(user.id).first();
        if (user.plan === "PRO" && active?.ends_at && active.ends_at <= now()) {
          await env.DB.batch([
            env.DB.prepare("UPDATE subscriptions SET status='expired' WHERE id=?").bind(active.id),
            env.DB.prepare("UPDATE users SET plan='FREE',storage_limit_bytes=1073741824,updated_at=? WHERE id=?").bind(now(),user.id)
          ]);
          user.plan="FREE"; user.storage_limit_bytes=1073741824;
        }
        const latest = await env.DB.prepare("SELECT id,plan,status,starts_at,ends_at,created_at FROM subscriptions WHERE user_id=? ORDER BY created_at DESC LIMIT 1").bind(user.id).first();
        const settings=await paymentSettings(env);
        return reply({ plan:user.plan, storage_limit_bytes:user.storage_limit_bytes, subscription:latest || null, payment:settings, pro_price_usd:5, pro_price_dzd:Math.round(5*settings.usd_dzd_rate) });
      }

      if (url.pathname === "/subscription/request" && request.method === "POST") {
        const user=await currentUser(request,env);
        if(!user)return reply({error:"Please sign in."},401);
        if(user.plan==="PRO")return reply({error:"You are already on PRO."},409);
        const pending=await env.DB.prepare("SELECT id FROM subscriptions WHERE user_id=? AND plan='PRO' AND status='pending'").bind(user.id).first();
        if(pending)return reply({error:"Your PRO request is already pending."},409);
        const form=await request.formData();
        const method=String(form.get("method")||"").toLowerCase();
        const reference=String(form.get("reference")||"").trim().slice(0,160);
        const file=form.get("receipt");
        if(!["ccp","cpa","cepa"].includes(method))return reply({error:"Choose a payment method."},400);
        if(!file || typeof file.arrayBuffer!=="function" || !file.size)return reply({error:"Attach your payment receipt."},400);
        if(file.size>10*1024*1024)return reply({error:"Receipt must be 10 MB or smaller."},400);
        const proofId=crypto.randomUUID(),subId=crypto.randomUUID();
        const key="payment-proofs/"+user.id+"/"+proofId;
        await env.FILES.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type||"application/octet-stream"}});
        try{
          await env.DB.batch([
            env.DB.prepare("INSERT INTO subscriptions (id,user_id,plan,status) VALUES (?,?,'PRO','pending')").bind(subId,user.id),
            env.DB.prepare("INSERT INTO payment_proofs (id,user_id,plan,proof_object_key,status) VALUES (?,?,'PRO',?,'pending')").bind(proofId,user.id,JSON.stringify({key,method,reference,filename:String(file.name||"receipt").slice(0,180)}))
          ]);
        }catch(error){await env.FILES.delete(key);throw error}
        return reply({ok:true,message:"Payment receipt submitted for administrator review."},201);
      }

      if (url.pathname === "/admin/payment-settings" && request.method === "GET") {
        const admin=await currentUser(request,env);
        if(!admin||admin.role!=="admin"||admin.email.toLowerCase()!==ADMIN_EMAIL||admin.must_change_password)return reply({error:"Administrator access required."},403);
        return reply({settings:await paymentSettings(env)});
      }
      if (url.pathname === "/admin/payment-settings" && request.method === "POST") {
        const admin=await currentUser(request,env);
        if(!admin||admin.role!=="admin"||admin.email.toLowerCase()!==ADMIN_EMAIL||admin.must_change_password)return reply({error:"Administrator access required."},403);
        const body=await request.json();
        const rate=Number(body.usd_dzd_rate);
        if(!Number.isFinite(rate)||rate<1||rate>100000)return reply({error:"Enter a valid USD to DZD exchange rate."},400);
        const entries=[["usd_dzd_rate",String(rate)],["ccp_details",String(body.ccp_details||"").trim().slice(0,2000)],["cpa_details",String(body.cpa_details||"").trim().slice(0,2000)],["cepa_details",String(body.cepa_details||"").trim().slice(0,2000)]];
        await env.DB.batch(entries.map(([k,v])=>env.DB.prepare("INSERT INTO app_settings (setting_key,setting_value,updated_at) VALUES (?,?,?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,updated_at=excluded.updated_at").bind(k,v,now())));
        return reply({ok:true,settings:await paymentSettings(env)});
      }

      if (url.pathname.startsWith("/admin/payment-proof/") && request.method === "GET") {
        const admin=await currentUser(request,env);
        if(!admin||admin.role!=="admin"||admin.email.toLowerCase()!==ADMIN_EMAIL||admin.must_change_password)return reply({error:"Administrator access required."},403);
        const id=url.pathname.split("/")[3];
        const proof=await env.DB.prepare("SELECT proof_object_key FROM payment_proofs WHERE id=?").bind(id).first();
        if(!proof)return reply({error:"Receipt not found."},404);
        let meta;try{meta=JSON.parse(proof.proof_object_key)}catch(_){return reply({error:"Legacy proof has no uploaded receipt."},404)}
        const object=await env.FILES.get(meta.key);
        if(!object)return reply({error:"Receipt file is missing."},404);
        return new Response(object.body,{headers:{...cors,"Content-Type":object.httpMetadata?.contentType||"application/octet-stream","Content-Disposition":"inline; filename*=UTF-8''"+encodeURIComponent(meta.filename||"receipt"),"Cache-Control":"private, no-store"}});
      }

      if (url.pathname === "/admin/overview" && request.method === "GET") {
        const admin = await currentUser(request, env);
        if (!admin || admin.role !== "admin" || admin.email.toLowerCase() !== ADMIN_EMAIL || admin.must_change_password) return reply({error:"Administrator access required."},403);
        const [users,requests,proofs,resets] = await Promise.all([
          env.DB.prepare("SELECT id,email,display_name,status,role,plan,storage_limit_bytes,storage_used_bytes,created_at FROM users ORDER BY created_at DESC LIMIT 300").all(),
          env.DB.prepare("SELECT s.id,s.user_id,s.status,s.created_at,u.email,u.display_name FROM subscriptions s JOIN users u ON u.id=s.user_id WHERE s.status='pending' ORDER BY s.created_at DESC LIMIT 100").all(),
          env.DB.prepare("SELECT p.id,p.user_id,p.proof_object_key,p.status,p.created_at,u.email FROM payment_proofs p JOIN users u ON u.id=p.user_id WHERE p.status='pending' ORDER BY p.created_at DESC LIMIT 100").all(),
          env.DB.prepare("SELECT r.id,r.status,r.requested_at,u.email,u.display_name FROM password_reset_requests r JOIN users u ON u.id=r.user_id WHERE r.status='pending' ORDER BY r.requested_at DESC LIMIT 100").all()
        ]);
        return reply({users:users.results,subscriptions:requests.results,paymentProofs:proofs.results,passwordResets:resets.results});
      }

      if (url.pathname === "/admin/subscriptions/review" && request.method === "POST") {
        const admin = await currentUser(request, env);
        if (!admin || admin.role !== "admin" || admin.email.toLowerCase() !== ADMIN_EMAIL || admin.must_change_password) return reply({error:"Administrator access required."},403);
        const body=await request.json(), id=String(body.id||""), action=String(body.action||"");
        if(!id || !["approve","reject"].includes(action)) return reply({error:"Invalid review request."},400);
        const sub=await env.DB.prepare("SELECT id,user_id,status FROM subscriptions WHERE id=? AND plan='PRO'").bind(id).first();
        if(!sub || sub.status!=="pending") return reply({error:"Pending subscription not found."},404);
        if(action==="reject"){
          await env.DB.batch([
            env.DB.prepare("UPDATE subscriptions SET status='cancelled' WHERE id=?").bind(id),
            env.DB.prepare("UPDATE payment_proofs SET status='rejected',reviewed_by=?,reviewed_at=? WHERE user_id=? AND status='pending'").bind(admin.id,now(),sub.user_id)
          ]);
          return reply({ok:true});
        }
        const start=now(), end=new Date(Date.now()+30*86400000).toISOString();
        await env.DB.batch([
          env.DB.prepare("UPDATE subscriptions SET status='expired' WHERE user_id=? AND status='active'").bind(sub.user_id),
          env.DB.prepare("UPDATE subscriptions SET status='active',starts_at=?,ends_at=?,granted_by_admin_id=? WHERE id=?").bind(start,end,admin.id,id),
          env.DB.prepare("UPDATE users SET plan='PRO',storage_limit_bytes=5368709120,updated_at=? WHERE id=?").bind(start,sub.user_id),
          env.DB.prepare("UPDATE payment_proofs SET status='approved',reviewed_by=?,reviewed_at=? WHERE user_id=? AND status='pending'").bind(admin.id,start,sub.user_id)
        ]);
        return reply({ok:true,ends_at:end});
      }

      if (url.pathname === "/admin/users/update" && request.method === "POST") {
        const admin = await currentUser(request, env);
        if (!admin || admin.role !== "admin" || admin.email.toLowerCase() !== ADMIN_EMAIL || admin.must_change_password) return reply({error:"Administrator access required."},403);
        const body=await request.json(), id=String(body.userId||""), action=String(body.action||"");
        if(!id || id===admin.id) return reply({error:"Invalid user."},400);
        const target=await env.DB.prepare("SELECT id,role FROM users WHERE id=?").bind(id).first();
        if(!target || target.role==="admin") return reply({error:"User not found or protected."},404);
        if(action==="suspend" || action==="activate") await env.DB.prepare("UPDATE users SET status=?,updated_at=? WHERE id=?").bind(action==="suspend"?"suspended":"active",now(),id).run();
        else if(action==="free") {
          await env.DB.batch([
            env.DB.prepare("UPDATE users SET plan='FREE',storage_limit_bytes=1073741824,updated_at=? WHERE id=?").bind(now(),id),
            env.DB.prepare("UPDATE subscriptions SET status='expired' WHERE user_id=? AND status='active'").bind(id)
          ]);
        } else if(action==="pro") {
          const start=now(),end=new Date(Date.now()+30*86400000).toISOString();
          await env.DB.batch([
            env.DB.prepare("UPDATE subscriptions SET status='expired' WHERE user_id=? AND status='active'").bind(id),
            env.DB.prepare("INSERT INTO subscriptions (id,user_id,plan,status,starts_at,ends_at,granted_by_admin_id) VALUES (?,?,'PRO','active',?,?,?)").bind(crypto.randomUUID(),id,start,end,admin.id),
            env.DB.prepare("UPDATE users SET plan='PRO',storage_limit_bytes=5368709120,updated_at=? WHERE id=?").bind(start,id)
          ]);
        } else if(action==="delete") {
          const files=await env.DB.prepare("SELECT object_key FROM files WHERE user_id=?").bind(id).all();
          for(const file of files.results||[]) await env.FILES.delete(file.object_key);
          await env.DB.prepare("DELETE FROM users WHERE id=?").bind(id).run();
        } else return reply({error:"Unsupported user action."},400);
        return reply({ok:true});
      }

      if (url.pathname.startsWith("/public/share/") && request.method === "GET") {
        const parts=url.pathname.split("/");
        const token=parts[3]||"";
        const isDownload=parts[4]==="download";
        if (!/^[a-f0-9]{48,80}$/.test(token)) return reply({error:"Invalid or unavailable share link."},404);
        const link=await env.DB.prepare("SELECT f.id,f.object_key,f.original_name,f.mime_type,f.size_bytes FROM share_links s JOIN files f ON f.id=s.file_id WHERE s.token_hash=? AND s.is_active=1 AND (s.expires_at IS NULL OR s.expires_at>?) AND f.status='active'").bind(await digest(token),now()).first();
        if(!link) return reply({error:"This share link is unavailable or has expired."},404);
        if(!isDownload) return reply({ok:true,file:{name:link.original_name,size_bytes:link.size_bytes,mime_type:link.mime_type}});
        const object=await env.FILES.get(link.object_key);
        if(!object) return reply({error:"Stored file is missing."},404);
        const safeName=encodeURIComponent(link.original_name).replaceAll("%20","+");
        return new Response(object.body,{headers:{...cors,"Content-Type":"application/octet-stream","Content-Disposition":"attachment; filename*=UTF-8''"+safeName,"Cache-Control":"private, no-store"}});
      }

      if (url.pathname.startsWith("/files/") && url.pathname.endsWith("/share") && request.method === "POST") {
        const user=await currentUser(request,env);
        if(!user) return reply({error:"Please sign in."},401);
        const id=url.pathname.split("/")[2];
        const file=await env.DB.prepare("SELECT id FROM files WHERE id=? AND user_id=? AND status='active'").bind(id,user.id).first();
        if(!file) return reply({error:"File not found."},404);
        const token=random(24);
        await env.DB.prepare("INSERT INTO share_links (id,token_hash,owner_user_id,file_id) VALUES (?,?,?,?)").bind(crypto.randomUUID(),await digest(token),user.id,id).run();
        return reply({ok:true,url:SITE_ORIGIN+"/share.html?token="+token});
      }

      if (url.pathname.startsWith("/files/") && url.pathname.endsWith("/download") && request.method === "GET") {
        const user = await currentUser(request, env);
        if (!user) return reply({ error: "Please sign in." }, 401);
        const id = url.pathname.split("/")[2];
        const file = await env.DB.prepare("SELECT object_key,original_name,mime_type FROM files WHERE id=? AND user_id=? AND status='active'").bind(id,user.id).first();
        if (!file) return reply({ error: "File not found." }, 404);
        const object = await env.FILES.get(file.object_key);
        if (!object) return reply({ error: "Stored file is missing." }, 404);
        const safeName = encodeURIComponent(file.original_name).replaceAll("%20","+");
        return new Response(object.body,{headers:{...cors,"Content-Type":file.mime_type,"Content-Disposition":"attachment; filename*=UTF-8''" + safeName,"Cache-Control":"private, no-store"}});
      }

      if (url.pathname.startsWith("/files/") && url.pathname.endsWith("/delete") && request.method === "POST") {
        const user = await currentUser(request, env);
        if (!user) return reply({ error: "Please sign in." }, 401);
        const id = url.pathname.split("/")[2];
        const file = await env.DB.prepare("SELECT object_key,size_bytes FROM files WHERE id=? AND user_id=?").bind(id,user.id).first();
        if (!file) return reply({ error: "File not found." }, 404);
        await env.FILES.delete(file.object_key);
        await env.DB.batch([
          env.DB.prepare("DELETE FROM files WHERE id=? AND user_id=?").bind(id,user.id),
          env.DB.prepare("UPDATE users SET storage_used_bytes=MAX(0,storage_used_bytes-?) WHERE id=?").bind(file.size_bytes,user.id)
        ]);
        return reply({ ok:true });
      }

      if (url.pathname.startsWith("/admin/password-reset-requests")) {
        const admin = await currentUser(request, env);
        if (!admin || admin.role !== "admin" || admin.email.toLowerCase() !== ADMIN_EMAIL || admin.must_change_password) return reply({ error: "Administrator access required. Complete any required password change first." }, 403);
        await ensureResetTable(env);
        if (request.method === "GET" && url.pathname === "/admin/password-reset-requests") {
          const { results } = await env.DB.prepare(`SELECT r.id,r.status,r.requested_at,u.email,u.display_name
            FROM password_reset_requests r JOIN users u ON u.id=r.user_id
            ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END,r.requested_at DESC LIMIT 100`).all();
          return reply({ requests: results });
        }
        if (request.method === "POST" && url.pathname === "/admin/password-reset-requests/review") {
          const body = await request.json();
          const id = String(body.requestId || "");
          const action = String(body.action || "");
          if (!id || !["approve","reject"].includes(action)) return reply({ error: "Invalid review action." }, 400);
          const req = await env.DB.prepare("SELECT id,user_id,status FROM password_reset_requests WHERE id=?").bind(id).first();
          if (!req || req.status !== "pending") return reply({ error: "Request not found or already reviewed." }, 404);
          if (action === "reject") {
            await env.DB.prepare("UPDATE password_reset_requests SET status='rejected',reviewed_at=?,reviewed_by=? WHERE id=?").bind(now(), admin.id, id).run();
            return reply({ ok: true });
          }
          const temporaryPassword = String(body.temporaryPassword || "");
          if (temporaryPassword.length < 10 || temporaryPassword.length > 128) return reply({ error: "Temporary password must be 10–128 characters." }, 400);
          const { hash, salt } = await passwordHash(temporaryPassword);
          await env.DB.batch([
            env.DB.prepare("UPDATE users SET password_hash=?,updated_at=? WHERE id=?").bind(`${salt}:${hash}`, now(), req.user_id),
            env.DB.prepare("INSERT OR REPLACE INTO password_change_required (user_id) VALUES (?)").bind(req.user_id),
            env.DB.prepare("UPDATE password_reset_requests SET status='approved',reviewed_at=?,reviewed_by=? WHERE id=?").bind(now(), admin.id, id),
            env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(req.user_id)
          ]);
          return reply({ ok: true, message: "Password changed. The user can sign in with the temporary password." });
        }
      }

      return reply({ error: "Not found" }, 404);
    } catch (error) {
      console.error("COLONY FILE API failure", {
        path: url.pathname,
        method: request.method,
        message: error?.message || String(error),
        stack: error?.stack || null
      });
      return reply({ error: "Internal server error.", requestPath: url.pathname }, 500);
    }
  }
};
