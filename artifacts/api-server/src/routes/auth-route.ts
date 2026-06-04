import { Router, type IRouter } from "express";

const router: IRouter = Router();

function loginPage(error?: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Giriş — Token Reward Admin</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0f1117;color:#e2e8f0;font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
  .card{background:#1a1d27;border:1px solid #2d3148;border-radius:16px;padding:40px 36px;width:100%;max-width:380px;box-shadow:0 24px 48px rgba(0,0,0,.5)}
  .logo{width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 20px}
  h1{font-size:20px;font-weight:700;color:#f8fafc;text-align:center;margin-bottom:6px}
  p{font-size:13px;color:#64748b;text-align:center;margin-bottom:28px}
  label{display:block;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
  input[type=password]{width:100%;background:#0f1117;border:1px solid #374151;border-radius:8px;padding:11px 14px;color:#f1f5f9;font-size:15px;outline:none;transition:border-color .2s;margin-bottom:16px}
  input[type=password]:focus{border-color:#6366f1}
  button{width:100%;background:linear-gradient(135deg,#6366f1,#7c3aed);color:#fff;border:none;border-radius:8px;padding:12px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s}
  button:hover{opacity:.85}
  .error{background:#450a0a;border:1px solid #ef4444;color:#fca5a5;border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:16px;text-align:center}
</style>
</head>
<body>
<div class="card">
  <div class="logo">⚡</div>
  <h1>Token Reward Admin</h1>
  <p>Devam etmek için şifrenizi girin</p>
  ${error ? `<div class="error">❌ ${error}</div>` : ""}
  <form method="POST" action="/login">
    <label>Şifre</label>
    <input type="password" name="password" placeholder="••••••••" autofocus autocomplete="current-password"/>
    <button type="submit">Giriş Yap</button>
  </form>
</div>
</body>
</html>`;
}

router.get("/login", (req, res) => {
  if (req.session?.authenticated) {
    res.redirect("/");
    return;
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(loginPage());
});

router.post("/login", (req, res) => {
  const password = req.body?.password as string | undefined;
  const adminPassword = process.env["ADMIN_PASSWORD"];

  if (!adminPassword) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(503).send(loginPage("ADMIN_PASSWORD ortam değişkeni ayarlanmamış."));
    return;
  }

  if (password === adminPassword) {
    req.session.authenticated = true;
    req.session.save(() => res.redirect("/"));
  } else {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(401).send(loginPage("Hatalı şifre. Tekrar deneyin."));
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

export default router;
