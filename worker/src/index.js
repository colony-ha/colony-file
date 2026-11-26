const SITE_ORIGIN = "https://colony-file.pages.dev";
const COOKIE = "colony_file_session";
const SESSION_DAYS = 14;
const ADMIN_EMAIL = "hanih9823@gmail.com";

const cors = {
  "Access-Control-Allow-Origin": SITE_ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
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
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: Uint8Array.from(salt.match(/.{2}/g).map(x => parseInt(x, 16))), iterations: 210000, hash: "SHA-256" }, material, 256);
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
