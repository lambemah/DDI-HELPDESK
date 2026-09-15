const express = require("express");
const session = require("express-session");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

/* =========================================================
   SESSION
========================================================= */

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "DDI-HELPDESK-SECRET-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

/* =========================================================
   OUTILS
========================================================= */

function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusClass(status) {
  if (status === "Nouveau") return "new";
  if (status === "En cours") return "progress";
  if (status === "Terminé") return "done";
  return "notdone";
}

function formatDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("fr-FR");
}

function formatDateTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
}

/* =========================================================
   RÉCUPÉRER LES DEMANDES
========================================================= */

async function getRequests() {
  const { data, error } = await supabase
    .from("demandes")
    .select("*")
    .order("date_creation", {
      ascending: false
    });

  if (error) {
    console.error("Erreur demandes :", error);
    throw error;
  }

  const requests = data || [];

  for (const request of requests) {
    const { data: messages, error: messageError } =
      await supabase
        .from("messages")
        .select("*")
        .eq("demande_id", request.id)
        .order("date_creation", {
          ascending: true
        });

    if (messageError) {
      console.error(
        "Erreur messages :",
        messageError
      );

      request.messages = [];
    } else {
      request.messages = (messages || []).map(
        message => ({
          auteur: message.auteur,
          texte: message.message,
          date: formatDateTime(
            message.date_creation
          )
        })
      );
    }

    request.status = request.statut;
    request.date = formatDate(
      request.date_creation
    );
  }

  return requests;
}

/* =========================================================
   STATISTIQUES
========================================================= */

async function stats() {
  const { data, error } = await supabase
    .from("demandes")
    .select("statut");

  if (error) {
    console.error("Erreur statistiques :", error);
    throw error;
  }

  const requests = data || [];

  return {
    total: requests.length,

    nouveau: requests.filter(
      r => r.statut === "Nouveau"
    ).length,

    cours: requests.filter(
      r => r.statut === "En cours"
    ).length,

    termine: requests.filter(
      r => r.statut === "Terminé"
    ).length,

    nontraite: requests.filter(
      r => r.statut === "Non traité"
    ).length
  };
}

/* =========================================================
   PAGE DE CONNEXION
========================================================= */

function loginPage(error = "") {
  return `
<!DOCTYPE html>
<html lang="fr">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Connexion - DDI HELPDESK</title>

<style>

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(135deg, #087ee8, #075fc0);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 410px;
  background: white;
  border-radius: 18px;
  padding: 35px;
  box-shadow: 0 20px 50px rgba(0,0,0,.18);
}

.logo {
  width: 58px;
  height: 58px;
  background: #087ee8;
  color: white;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 18px;
}

h1 {
  font-size: 25px;
  color: #172033;
}

.subtitle {
  color: #718096;
  font-size: 13px;
  margin-top: 7px;
  margin-bottom: 28px;
}

label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 7px;
  color: #344054;
}

.form-group {
  margin-bottom: 18px;
}

input {
  width: 100%;
  padding: 13px;
  border: 1px solid #dfe6ee;
  border-radius: 9px;
  font-size: 14px;
  outline: none;
}

input:focus {
  border-color: #087ee8;
}

button {
  width: 100%;
  border: none;
  background: #087ee8;
  color: white;
  padding: 13px;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  background: #066bc5;
}

.error {
  background: #fdebec;
  color: #c92a36;
  padding: 11px;
  border-radius: 8px;
  font-size: 12px;
  margin-bottom: 18px;
}

.footer {
  text-align: center;
  color: #98a2b3;
  font-size: 11px;
  margin-top: 24px;
}

</style>

</head>

<body>

<div class="login-box">

<div class="logo">D</div>

<h1>
Bienvenue sur DDI HELPDESK
</h1>

<p class="subtitle">
Connectez-vous pour accéder au suivi des demandes informatiques.
</p>

${
  error
    ? `<div class="error">${escapeHtml(error)}</div>`
    : ""
}

<form method="POST" action="/login">

<div class="form-group">

<label>
Nom d'utilisateur
</label>

<input
type="text"
name="username"
placeholder="Votre nom d'utilisateur"
required
autofocus>

</div>

<div class="form-group">

<label>
Mot de passe
</label>

<input
type="password"
name="password"
placeholder="Votre mot de passe"
required>

</div>

<button type="submit">
Se connecter
</button>

</form>

<div class="footer">
DDI HELPDESK · Service Informatique
</div>

</div>

</body>

</html>
`;
}

/* =========================================================
   SIDEBAR
========================================================= */

function sidebar(active = "dashboard") {

  return `
<aside class="sidebar">

<div class="brand">

<div class="brand-icon">
D
</div>

<div>

<strong>DDI</strong>

<span>
HELPDESK
</span>

</div>

</div>

<div class="menu-title">
MENU
</div>

<a
href="/"
class="menu-item ${
  active === "dashboard"
    ? "active"
    : ""
}">

<span>▦</span>
<span>Tableau de bord</span>

</a>

<a
href="/canal"
class="menu-item ${
  active === "canal"
    ? "active"
    : ""
}">

<span>💬</span>
<span>Canal DDI</span>

</a>

<a
href="/new"
class="menu-item ${
  active === "new"
    ? "active"
    : ""
}">

<span>＋</span>
<span>Nouvelle demande</span>

</a>

<a
href="/requests"
class="menu-item ${
  active === "requests"
    ? "active"
    : ""
}">

<span>☷</span>
<span>Toutes les demandes</span>

</a>

<a
href="/notifications"
class="menu-item ${
  active === "notifications"
    ? "active"
    : ""
}">

<span>♢</span>
<span>Notifications</span>

</a>

<a
href="/users"
class="menu-item ${
  active === "users"
    ? "active"
    : ""
}">

<span>♙</span>
<span>Utilisateurs</span>

</a>

<div class="sidebar-bottom">

<div class="online">

<span class="online-dot"></span>

${escapeHtml(
  "Service Informatique"
)}

</div>

<a
href="/logout"
class="logout">

⇥ Déconnexion

</a>

</div>

</aside>
`;
}

/* =========================================================
   LAYOUT
========================================================= */

function layout(content, active = "dashboard") {

  const titles = {
    dashboard: "Tableau de bord",
    canal: "Canal DDI",
    new: "Nouvelle demande",
    requests: "Toutes les demandes",
    notifications: "Notifications",
    users: "Utilisateurs"
  };

  return `
<!DOCTYPE html>
<html lang="fr">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>DDI HELPDESK</title>

<style>

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  background: #f4f7fb;
  color: #172033;
}

a {
  text-decoration: none;
  color: inherit;
}

.app {
  min-height: 100vh;
  display: flex;
}

/* SIDEBAR */

.sidebar {
  width: 250px;
  min-height: 100vh;
  background: linear-gradient(180deg, #087ee8, #075fc0);
  color: white;
  padding: 24px 16px;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 10px 28px;
}

.brand-icon {
  width: 42px;
  height: 42px;
  background: white;
  color: #087ee8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
}

.brand strong {
  display: block;
  font-size: 20px;
  letter-spacing: 1px;
}

.brand span {
  display: block;
  font-size: 11px;
  opacity: .8;
  letter-spacing: 2px;
  margin-top: 2px;
}

.menu-title {
  font-size: 10px;
  opacity: .6;
  padding: 0 12px 9px;
  letter-spacing: 1.5px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 12px 13px;
  border-radius: 10px;
  margin-bottom: 5px;
  font-size: 14px;
  transition: .2s;
}

.menu-item span:first-child {
  width: 20px;
  text-align: center;
  font-size: 18px;
}

.menu-item:hover {
  background: rgba(255,255,255,.12);
}

.menu-item.active {
  background: white;
  color: #0875d8;
  font-weight: 700;
}

.sidebar-bottom {
  margin-top: auto;
}

.online {
  font-size: 12px;
  padding: 12px;
  opacity: .9;
  display: flex;
  align-items: center;
  gap: 8px;
}

.online-dot {
  width: 8px;
  height: 8px;
  background: #31e981;
  border-radius: 50%;
}

.logout {
  border-top: 1px solid rgba(255,255,255,.15);
  padding: 15px 12px 4px;
  font-size: 13px;
  opacity: .85;
}

.logout:hover {
  opacity: 1;
}

/* MAIN */

.main {
  margin-left: 250px;
  width: calc(100% - 250px);
  min-height: 100vh;
}

.topbar {
  height: 72px;
  background: white;
  border-bottom: 1px solid #e8edf4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px;
}

.topbar-title {
  font-size: 14px;
  color: #718096;
}

.topbar-title strong {
  color: #1d2939;
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #e9f4ff;
  color: #0875d8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

/* CONTENT */

.content {
  padding: 32px;
  max-width: 1450px;
  margin: auto;
}

.page-title {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 25px;
}

.page-title h1 {
  font-size: 27px;
  margin-bottom: 6px;
}

.page-title p {
  color: #718096;
  font-size: 14px;
}

.btn {
  border: none;
  background: #087ee8;
  color: white;
  padding: 11px 17px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}

.btn:hover {
  background: #066bc5;
}

/* DASHBOARD */

.stat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border: 1px solid #e8edf4;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 3px 12px rgba(25,50,80,.04);
}

.stat-label {
  color: #718096;
  font-size: 12px;
  margin-bottom: 12px;
}

.stat-number {
  font-size: 29px;
  font-weight: 800;
}

.stat-sub {
  font-size: 11px;
  color: #98a2b3;
  margin-top: 6px;
}

.blue {
  color: #087ee8;
}

.orange {
  color: #ed8b00;
}

.green {
  color: #19a463;
}

.red {
  color: #dc3545;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  background: white;
  border: 1px solid #e8edf4;
  border-radius: 14px;
  box-shadow: 0 3px 12px rgba(25,50,80,.04);
}

.panel-header {
  padding: 20px 22px;
  border-bottom: 1px solid #edf1f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h2 {
  font-size: 16px;
}

.panel-header span {
  font-size: 12px;
  color: #8994a5;
}

.panel-body {
  padding: 22px;
}

.bar-row {
  margin-bottom: 18px;
}

.bar-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 7px;
}

.bar-info span:last-child {
  font-weight: 700;
}

.bar {
  width: 100%;
  height: 9px;
  background: #edf2f7;
  border-radius: 20px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 20px;
  background: #087ee8;
}

.bar-fill.green {
  background: #19a463;
}

.bar-fill.orange {
  background: #ed8b00;
}

.bar-fill.red {
  background: #dc3545;
}

.resolution {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 210px;
  flex-direction: column;
}

.circle {
  width: 145px;
  height: 145px;
  border-radius: 50%;
  background: conic-gradient(
    #19a463 0deg,
    #19a463 var(--degree),
    #edf2f7 var(--degree),
    #edf2f7 360deg
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circle::after {
  content: "";
  position: absolute;
  width: 108px;
  height: 108px;
  background: white;
  border-radius: 50%;
}

.circle-value {
  position: relative;
  z-index: 2;
  font-size: 25px;
  font-weight: 800;
  color: #172033;
}

.resolution-text {
  margin-top: 12px;
  color: #718096;
  font-size: 12px;
}

/* TABLE */

.recent {
  width: 100%;
  border-collapse: collapse;
}

.recent th {
  text-align: left;
  font-size: 11px;
  color: #8994a5;
  font-weight: 600;
  padding: 13px 18px;
  border-bottom: 1px solid #edf1f5;
}

.recent td {
  padding: 15px 18px;
  font-size: 13px;
  border-bottom: 1px solid #f0f3f7;
}

.recent tr:last-child td {
  border-bottom: none;
}

.id {
  color: #087ee8;
  font-weight: 700;
}

.status {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
}

.status.new {
  background: #e9f4ff;
  color: #087ee8;
}

.status.progress {
  background: #fff3df;
  color: #c87900;
}

.status.done {
  background: #e6f7ef;
  color: #168653;
}

.status.notdone {
  background: #fdebec;
  color: #cf3340;
}

/* REQUESTS */

.request-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.request-card {
  background: white;
  border: 1px solid #e7edf4;
  border-radius: 12px;
  padding: 17px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  transition: .2s;
}

.request-card:hover {
  border-color: #b7dafa;
  transform: translateY(-1px);
}

.request-left {
  display: flex;
  align-items: center;
  gap: 13px;
}

.request-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e9f4ff;
  color: #087ee8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.request-name {
  font-weight: 700;
  font-size: 14px;
}

.request-meta {
  color: #8a94a6;
  font-size: 11px;
  margin-top: 4px;
}

.request-subject {
  font-size: 13px;
  margin-top: 5px;
}

.request-right {
  text-align: right;
}

/* FORM */

.form-box {
  max-width: 700px;
  background: white;
  border: 1px solid #e8edf4;
  border-radius: 14px;
  padding: 25px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 7px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #dfe6ee;
  border-radius: 9px;
  font-family: inherit;
  outline: none;
  font-size: 13px;
}

.form-group textarea {
  min-height: 130px;
  resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #087ee8;
}

/* CONVERSATION */

.conversation {
  max-width: 900px;
  background: white;
  border: 1px solid #e7edf4;
  border-radius: 14px;
  overflow: hidden;
}

.conversation-header {
  padding: 18px 22px;
  border-bottom: 1px solid #edf1f5;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back {
  color: #087ee8;
  font-size: 13px;
  margin-bottom: 12px;
  display: inline-block;
}

.conversation-title strong {
  font-size: 16px;
}

.conversation-title span {
  display: block;
  color: #8a94a6;
  font-size: 11px;
  margin-top: 4px;
}

.messages {
  padding: 25px;
  background: #f6f9fc;
  min-height: 360px;
}

.message {
  max-width: 70%;
  background: white;
  border: 1px solid #e5ebf2;
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 13px;
}

.message.me {
  margin-left: auto;
  background: #e9f4ff;
  border-color: #cce5fb;
}

.message-author {
  font-size: 11px;
  font-weight: 700;
  color: #0875d8;
  margin-bottom: 5px;
}

.message-text {
  font-size: 13px;
  line-height: 1.5;
}

.message-date {
  color: #9aa4b2;
  font-size: 9px;
  margin-top: 6px;
}

.message-form {
  padding: 15px;
  display: flex;
  gap: 10px;
  border-top: 1px solid #edf1f5;
}

.message-form input {
  flex: 1;
  border: 1px solid #dfe6ee;
  border-radius: 9px;
  padding: 12px;
  outline: none;
}

.status-actions {
  padding: 15px 20px;
  border-top: 1px solid #edf1f5;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.status-actions span {
  color: #718096;
  font-size: 12px;
  margin-right: 5px;
}

.status-btn {
  border: 1px solid #dce4ed;
  background: white;
  border-radius: 8px;
  padding: 8px 11px;
  cursor: pointer;
  font-size: 11px;
}

/* EMPTY */

.empty {
  text-align: center;
  padding: 60px 20px;
  color: #8994a5;
}

/* MOBILE */

@media (max-width: 1050px) {

  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 750px) {

  .sidebar {
    width: 70px;
    padding: 15px 8px;
  }

  .brand {
    justify-content: center;
    padding: 4px 0 20px;
  }

  .brand > div:last-child,
  .menu-title,
  .menu-item span:last-child,
  .online,
  .logout {
    display: none;
  }

  .menu-item {
    justify-content: center;
    padding: 12px 5px;
  }

  .main {
    margin-left: 70px;
    width: calc(100% - 70px);
  }

  .topbar {
    padding: 0 15px;
  }

  .content {
    padding: 20px 14px;
  }

  .page-title {
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
  }

  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recent {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }

  .request-card {
    align-items: flex-start;
  }

  .request-right {
    text-align: left;
  }

}

</style>

</head>

<body>

<div class="app">

${sidebar(active)}

<main class="main">

<header class="topbar">

<div class="topbar-title">

DDI HELPDESK /

<strong>
${titles[active] || "Gestion"}
</strong>

</div>

<div class="user">

<span>
Service Informatique
</span>

<div class="avatar">
IT
</div>

</div>

</header>

${content}

</main>

</div>

</body>

</html>
`;
}

/* =========================================================
   TABLEAU DE BORD
========================================================= */

async function dashboardPage() {

  const s = await stats();

  const resolutionRate =
    s.total === 0
      ? 0
      : Math.round(
          (s.termine / s.total) * 100
        );

  const degree =
    Math.round(
      (resolutionRate / 100) * 360
    );

  const requests =
    await getRequests();

  const services = {};

  requests.forEach(r => {

    services[r.service] =
      (services[r.service] || 0) + 1;

  });

  const serviceRows =
    Object.entries(services)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

  const maxService =
    serviceRows.length
      ? Math.max(
          ...serviceRows.map(x => x[1])
        )
      : 1;

  const recent =
    requests.slice(0, 5);

  return layout(`

<section class="content">

<div class="page-title">

<div>

<h1>
Tableau de bord
</h1>

<p>
Vue globale du suivi des demandes informatiques
</p>

</div>

<a href="/new" class="btn">
＋ Nouvelle demande
</a>

</div>

<div class="stat-grid">

<div class="stat-card">

<div class="stat-label">
TOTAL DES REQUÊTES
</div>

<div class="stat-number blue">
${s.total}
</div>

<div class="stat-sub">
Toutes les demandes
</div>

</div>

<div class="stat-card">

<div class="stat-label">
NOUVELLES
</div>

<div class="stat-number blue">
${s.nouveau}
</div>

<div class="stat-sub">
À prendre en charge
</div>

</div>

<div class="stat-card">

<div class="stat-label">
EN COURS
</div>

<div class="stat-number orange">
${s.cours}
</div>

<div class="stat-sub">
Interventions en cours
</div>

</div>

<div class="stat-card">

<div class="stat-label">
TERMINÉES
</div>

<div class="stat-number green">
${s.termine}
</div>

<div class="stat-sub">
Demandes résolues
</div>

</div>

<div class="stat-card">

<div class="stat-label">
NON TRAITÉES
</div>

<div class="stat-number red">
${s.nontraite}
</div>

<div class="stat-sub">
En attente d'intervention
</div>

</div>

</div>

<div class="dashboard-grid">

<div class="panel">

<div class="panel-header">

<h2>
Répartition des demandes
</h2>

<span>
Suivi actuel
</span>

</div>

<div class="panel-body">

${[
  ["🆕 Nouvelles", s.nouveau, ""],
  ["🔵 En cours", s.cours, "orange"],
  ["🟢 Terminées", s.termine, "green"],
  ["🔴 Non traitées", s.nontraite, "red"]
]
.map(
  ([label, count, color]) => `

<div class="bar-row">

<div class="bar-info">

<span>
${label}
</span>

<span>
${count}
</span>

</div>

<div class="bar">

<div
class="bar-fill ${color}"
style="width:${
  s.total
    ? (count / s.total) * 100
    : 0
}%">
</div>

</div>

</div>

`
)
.join("")}

</div>

</div>

<div class="panel">

<div class="panel-header">

<h2>
Taux de résolution
</h2>

<span>
Global
</span>

</div>

<div class="panel-body resolution">

<div
class="circle"
style="--degree:${degree}deg">

<div class="circle-value">
${resolutionRate}%
</div>

</div>

<div class="resolution-text">

${s.termine}
demande(s) terminée(s)
sur ${s.total}

</div>

</div>

</div>

</div>

<div class="dashboard-grid">

<div class="panel">

<div class="panel-header">

<h2>
Demandes par service
</h2>

<span>
Services les plus concernés
</span>

</div>

<div class="panel-body">

${
  serviceRows.length
    ? serviceRows
        .map(
          ([service, count]) => `

<div class="bar-row">

<div class="bar-info">

<span>
${escapeHtml(service)}
</span>

<span>
${count}
</span>

</div>

<div class="bar">

<div
class="bar-fill"
style="width:${
  (count / maxService) * 100
}%">
</div>

</div>

</div>

`
        )
        .join("")
    : `<div class="empty">
        Aucune donnée disponible.
       </div>`
}

</div>

</div>

<div class="panel">

<div class="panel-header">

<h2>
Indicateur IT
</h2>

<span>
Situation actuelle
</span>

</div>

<div class="panel-body">

<div class="bar-row">

<div class="bar-info">

<span>
Demandes prises en charge
</span>

<span>
${s.cours + s.termine}
</span>

</div>

<div class="bar">

<div
class="bar-fill green"
style="width:${
  s.total
    ? ((s.cours + s.termine) / s.total) * 100
    : 0
}%">
</div>

</div>

</div>

<div class="bar-row">

<div class="bar-info">

<span>
Demandes en attente
</span>

<span>
${s.nouveau + s.nontraite}
</span>

</div>

<div class="bar">

<div
class="bar-fill red"
style="width:${
  s.total
    ? ((s.nouveau + s.nontraite) / s.total) * 100
    : 0
}%">
</div>

</div>

</div>

<div
style="
margin-top:25px;
padding:15px;
background:#f6f9fc;
border-radius:10px;
">

<div
style="
font-size:12px;
color:#718096;
margin-bottom:6px;
">

État du service informatique

</div>

<div
style="
font-size:18px;
font-weight:700;
">

${
  s.nontraite > 0
    ? "Des demandes nécessitent une attention"
    : "Toutes les demandes sont prises en charge"
}

</div>

</div>

</div>

</div>

</div>

<div class="panel">

<div class="panel-header">

<h2>
Dernières demandes
</h2>

<a
href="/requests"
style="
color:#087ee8;
font-size:12px;
">

Voir toutes les demandes →

</a>

</div>

${
  recent.length
    ? `

<table class="recent">

<thead>

<tr>

<th>
RÉFÉRENCE
</th>

<th>
DEMANDEUR
</th>

<th>
SERVICE
</th>

<th>
DEMANDE
</th>

<th>
STATUT
</th>

</tr>

</thead>

<tbody>

${recent
  .map(
    r => `

<tr>

<td>

<a
href="/request?id=${encodeURIComponent(
      r.id
    )}"
class="id">

${escapeHtml(r.id)}

</a>

</td>

<td>
${escapeHtml(r.nom)}
</td>

<td>
${escapeHtml(r.service)}
</td>

<td>
${escapeHtml(r.sujet)}
</td>

<td>

<span
class="status ${statusClass(
      r.status
    )}">

${escapeHtml(r.status)}

</span>

</td>

</tr>

`
  )
  .join("")}

</tbody>

</table>

`
    : `<div class="empty">
        Aucune demande enregistrée.
       </div>`
}

</div>

</section>

`, "dashboard");
}

/* =========================================================
   CANAL DDI
========================================================= */

async function canalPage() {

  const requests =
    await getRequests();

  return layout(`

<section class="content">

<div class="page-title">

<div>

<h1>
Canal DDI
</h1>

<p>
Les demandes informatiques reçues par le service IT
</p>

</div>

<a href="/new" class="btn">
＋ Nouvelle demande
</a>

</div>

<div class="request-list">

${
  requests.length
    ? requests
        .map(
          r => `

<a
href="/request?id=${encodeURIComponent(
            r.id
          )}"
class="request-card">

<div class="request-left">

<div class="request-avatar">

${escapeHtml(
  r.nom.charAt(0).toUpperCase()
)}

</div>

<div>

<div class="request-name">

${escapeHtml(r.nom)}

</div>

<div class="request-meta">

${escapeHtml(r.service)}
·
${escapeHtml(r.date)}

</div>

<div class="request-subject">

${escapeHtml(r.sujet)}

</div>

</div>

</div>

<div class="request-right">

<span
class="status ${statusClass(
            r.status
          )}">

${escapeHtml(r.status)}

</span>

<div
style="
font-size:10px;
color:#9aa4b2;
margin-top:7px;
">

${escapeHtml(r.id)}

</div>

</div>

</a>

`
        )
        .join("")
    : `<div class="empty">
        Aucune demande.
       </div>`
}

</div>

</section>

`, "canal");
}

/* =========================================================
   TOUTES LES DEMANDES
========================================================= */

async function requestsPage() {

  const requests =
    await getRequests();

  return layout(`

<section class="content">

<div class="page-title">

<div>

<h1>
Toutes les demandes
</h1>

<p>
Historique complet des demandes informatiques
</p>

</div>

</div>

<div class="panel">

${
  requests.length
    ? `

<table class="recent">

<thead>

<tr>

<th>RÉFÉRENCE</th>
<th>DEMANDEUR</th>
<th>SERVICE</th>
<th>DEMANDE</th>
<th>DATE</th>
<th>STATUT</th>

</tr>

</thead>

<tbody>

${requests
  .map(
    r => `

<tr>

<td>

<a
href="/request?id=${encodeURIComponent(
      r.id
    )}"
class="id">

${escapeHtml(r.id)}

</a>

</td>

<td>
${escapeHtml(r.nom)}
</td>

<td>
${escapeHtml(r.service)}
</td>

<td>
${escapeHtml(r.sujet)}
</td>

<td>
${escapeHtml(r.date)}
</td>

<td>

<span
class="status ${statusClass(
      r.status
    )}">

${escapeHtml(r.status)}

</span>

</td>

</tr>

`
  )
  .join("")}

</tbody>

</table>

`
    : `<div class="empty">
        Aucune demande enregistrée.
       </div>`
}

</div>

</section>

`, "requests");
}

/* =========================================================
   NOUVELLE DEMANDE
========================================================= */

function newPage() {

  return layout(`

<section class="content">

<div class="page-title">

<div>

<h1>
Nouvelle demande
</h1>

<p>
Enregistrer une nouvelle demande informatique
</p>

</div>

</div>

<div class="form-box">

<form method="POST" action="/new">

<div class="form-group">

<label>
Nom du demandeur
</label>

<input
type="text"
name="nom"
placeholder="Ex : Mamadou"
required>

</div>

<div class="form-group">

<label>
Service
</label>

<select
name="service"
required>

<option value="">
Choisir le service
</option>

<option>Direction</option>
<option>Ressources Humaines</option>
<option>Comptabilité</option>
<option>Commercial</option>
<option>Administration</option>
<option>Autre</option>

</select>

</div>

<div class="form-group">

<label>
Objet de la demande
</label>

<input
type="text"
name="sujet"
placeholder="Ex : Ordinateur en panne"
required>

</div>

<div class="form-group">

<label>
Description
</label>

<textarea
name="description"
placeholder="Décrivez le problème rencontré..."
required></textarea>

</div>

<button
class="btn"
type="submit">

Envoyer la demande

</button>

</form>

</div>

</section>

`, "new");
}

/* =========================================================
   CONVERSATION
========================================================= */

async function requestPage(id) {

  const { data: request, error } =
    await supabase
      .from("demandes")
      .select("*")
      .eq("id", id)
      .single();

  if (error || !request) {

    return layout(`

<section class="content">

<div class="empty">

<h2>
Demande introuvable
</h2>

<br>

<a
href="/canal"
class="btn">

Retour au canal

</a>

</div>

</section>

`, "canal");
  }

  const { data: messages } =
    await supabase
      .from("messages")
      .select("*")
      .eq("demande_id", id)
      .order("date_creation", {
        ascending: true
      });

  return layout(`

<section class="content">

<a
href="/canal"
class="back">

← Retour au Canal DDI

</a>

<div class="conversation">

<div class="conversation-header">

<div class="conversation-title">

<strong>
${escapeHtml(request.sujet)}
</strong>

<span>

${escapeHtml(request.id)}
·
${escapeHtml(request.nom)}
·
${escapeHtml(request.service)}

</span>

</div>

<span
class="status ${statusClass(
    request.statut
  )}">

${escapeHtml(request.statut)}

</span>

</div>

<div class="messages">

${
  messages && messages.length
    ? messages
        .map(
          m => `

<div
class="message ${
            m.auteur ===
            "Service Informatique"
              ? "me"
              : ""
          }">

<div class="message-author">

${escapeHtml(m.auteur)}

</div>

<div class="message-text">

${escapeHtml(m.message)}

</div>

<div class="message-date">

${escapeHtml(
  formatDateTime(m.date_creation)
)}

</div>

</div>

`
        )
        .join("")
    : `<div class="empty">
        Aucun message.
       </div>`
}

</div>

<div class="status-actions">

<span>
Changer le statut :
</span>

${[
  ["Nouveau", "🆕 Nouveau"],
  ["En cours", "🔵 En cours"],
  ["Terminé", "🟢 Terminé"],
  ["Non traité", "🔴 Non traité"]
]
.map(
  ([status, label]) => `

<form method="POST" action="/status">

<input
type="hidden"
name="id"
value="${escapeHtml(request.id)}">

<input
type="hidden"
name="status"
value="${status}">

<button
class="status-btn">

${label}

</button>

</form>

`
)
.join("")}

</div>

<form
method="POST"
action="/message"
class="message-form">

<input
type="hidden"
name="id"
value="${escapeHtml(request.id)}">

<input
type="text"
name="message"
placeholder="Écrire un message..."
required>

<button
class="btn"
type="submit">

Envoyer

</button>

</form>

</div>

</section>

`, "canal");
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

async function notificationsPage() {

  const requests =
    await getRequests();

  const pending =
    requests.filter(
      r =>
        r.status === "Nouveau" ||
        r.status === "Non traité"
    );

  return layout(`

<section class="content">

<div class="page-title">

<div>

<h1>
Notifications
</h1>

<p>
Demandes nécessitant une attention
</p>

</div>

</div>

<div class="panel">

${
  pending.length
    ? pending
        .map(
          r => `

<a
href="/request?id=${encodeURIComponent(
            r.id
          )}"
style="
display:flex;
justify-content:space-between;
align-items:center;
padding:18px;
border-bottom:1px solid #edf1f5;
">

<div>

<strong>
${escapeHtml(r.id)}
</strong>

<div
style="
font-size:12px;
color:#718096;
margin-top:5px;
">

${escapeHtml(r.nom)}
·
${escapeHtml(r.sujet)}

</div>

</div>

<span
class="status ${statusClass(
            r.status
          )}">

${escapeHtml(r.status)}

</span>

</a>

`
        )
        .join("")
    : `<div class="empty">
        Aucune notification.
       </div>`
}

</div>

</section>

`, "notifications");
}

/* =========================================================
   UTILISATEURS
========================================================= */

async function usersPage() {

  const { data: users, error } =
    await supabase
      .from("utilisateurs")
      .select("*")
      .order("id", {
        ascending: true
      });

  if (error) {
    console.error(
      "Erreur utilisateurs :",
      error
    );

    return layout(`

<section class="content">

<div class="empty">
Impossible de charger les utilisateurs.
</div>

</section>

`, "users");
  }

  return layout(`

<section class="content">

<div class="page-title">

<div>

<h1>
Utilisateurs
</h1>

<p>
Gestion des accès à DDI HELPDESK
</p>

</div>

</div>

<div class="panel">

<table class="recent">

<thead>

<tr>

<th>UTILISATEUR</th>
<th>IDENTIFIANT</th>
<th>SERVICE</th>
<th>RÔLE</th>

</tr>

</thead>

<tbody>

${
  (users || [])
    .map(
      u => `

<tr>

<td>
${escapeHtml(u.nom)}
</td>

<td>
${escapeHtml(u.username)}
</td>

<td>
${escapeHtml(u.service || "")}
</td>

<td>
${escapeHtml(u.role)}
</td>

</tr>

`
    )
    .join("")
}

</tbody>

</table>

</div>

</section>

`, "users");
}

/* =========================================================
   CONNEXION
========================================================= */

app.get("/login", (req, res) => {

  if (req.session.user) {
    return res.redirect("/");
  }

  res.send(loginPage());
});

app.post("/login", async (req, res) => {

  try {

    const username =
      String(
        req.body.username || ""
      ).trim();

    const password =
      String(
        req.body.password || ""
      );

    const { data: user, error } =
      await supabase
        .from("utilisateurs")
        .select("*")
        .eq("username", username)
        .eq("mot_de_passe", password)
        .maybeSingle();

    if (error) {

      console.error(
        "Erreur connexion :",
        error
      );

      return res.send(
        loginPage(
          "Erreur de connexion à la base de données."
        )
      );
    }

    if (!user) {

      return res.send(
        loginPage(
          "Nom d'utilisateur ou mot de passe incorrect."
        )
      );
    }

    req.session.user = {
      id: user.id,
      nom: user.nom,
      username: user.username,
      role: user.role,
      service: user.service
    };

    res.redirect("/");

  } catch (error) {

    console.error(error);

    res.send(
      loginPage(
        "Une erreur est survenue."
      )
    );
  }
});

/* =========================================================
   DÉCONNEXION
========================================================= */

app.get("/logout", (req, res) => {

  req.session.destroy(() => {
    res.redirect("/login");
  });

});

/* =========================================================
   ROUTES
========================================================= */

app.get("/", requireLogin, async (req, res) => {

  try {
    res.send(
      await dashboardPage()
    );
  } catch (error) {

    console.error(error);

    res.status(500).send(
      "Erreur lors du chargement du tableau de bord."
    );
  }

});

app.get("/canal", requireLogin, async (req, res) => {

  try {
    res.send(
      await canalPage()
    );
  } catch (error) {

    console.error(error);

    res.status(500).send(
      "Erreur lors du chargement du Canal DDI."
    );
  }

});

app.get("/requests", requireLogin, async (req, res) => {

  try {
    res.send(
      await requestsPage()
    );
  } catch (error) {

    console.error(error);

    res.status(500).send(
      "Erreur lors du chargement des demandes."
    );
  }

});

app.get("/new", requireLogin, (req, res) => {
  res.send(newPage());
});

app.get("/request", requireLogin, async (req, res) => {

  try {
    res.send(
      await requestPage(req.query.id)
    );
  } catch (error) {

    console.error(error);

    res.status(500).send(
      "Erreur lors du chargement de la demande."
    );
  }

});

app.get(
  "/notifications",
  requireLogin,
  async (req, res) => {

    try {
      res.send(
        await notificationsPage()
      );
    } catch (error) {

      console.error(error);

      res.status(500).send(
        "Erreur lors du chargement des notifications."
      );
    }

  }
);

app.get("/users", requireLogin, async (req, res) => {

  try {
    res.send(
      await usersPage()
    );
  } catch (error) {

    console.error(error);

    res.status(500).send(
      "Erreur lors du chargement des utilisateurs."
    );
  }

});

/* =========================================================
   CRÉER UNE DEMANDE
========================================================= */

app.post("/new", requireLogin, async (req, res) => {

  try {

    const nom =
      String(req.body.nom || "").trim();

    const service =
      String(req.body.service || "").trim();

    const sujet =
      String(req.body.sujet || "").trim();

    const description =
      String(
        req.body.description || ""
      ).trim();

    if (!nom || !service || !sujet || !description) {
      return res.status(400).send(
        "Tous les champs sont obligatoires."
      );
    }

    /* Trouver le prochain numéro */

    const { data: existing, error: findError } =
      await supabase
        .from("demandes")
        .select("id");

    if (findError) {
      throw findError;
    }

    let maxNumber = 0;

    (existing || []).forEach(item => {

      const match =
        String(item.id).match(
          /DDI-(\d+)/
        );

      if (match) {

        const number =
          parseInt(match[1], 10);

        if (number > maxNumber) {
          maxNumber = number;
        }

      }

    });

    const newId =
      `DDI-${String(
        maxNumber + 1
      ).padStart(4, "0")}`;

    /* Créer la demande */

    const { error: insertError } =
      await supabase
        .from("demandes")
        .insert({
          id: newId,
          nom,
          service,
          sujet,
          description,
          statut: "Nouveau"
        });

    if (insertError) {
      throw insertError;
    }

    /* Premier message */

    const { error: messageError } =
      await supabase
        .from("messages")
        .insert({
          demande_id: newId,
          auteur: nom,
          message: description
        });

    if (messageError) {
      throw messageError;
    }

    res.redirect(
      `/request?id=${encodeURIComponent(
        newId
      )}`
    );

  } catch (error) {

    console.error(
      "Erreur création demande :",
      error
    );

    res.status(500).send(
      "Impossible d'enregistrer la demande."
    );
  }

});

/* =========================================================
   CHANGER LE STATUT
========================================================= */

app.post("/status", requireLogin, async (req, res) => {

  const id =
    String(req.body.id || "");

  const status =
    String(req.body.status || "");

  const allowedStatuses = [
    "Nouveau",
    "En cours",
    "Terminé",
    "Non traité"
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).send(
      "Statut invalide."
    );
  }

  try {

    const { error: updateError } =
      await supabase
        .from("demandes")
        .update({
          statut: status,
          date_modification:
            new Date().toISOString()
        })
        .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    const { error: messageError } =
      await supabase
        .from("messages")
        .insert({
          demande_id: id,
          auteur: "Service Informatique",
          message:
            `Statut de la demande changé en : ${status}`
        });

    if (messageError) {
      throw messageError;
    }

    res.redirect(
      `/request?id=${encodeURIComponent(id)}`
    );

  } catch (error) {

    console.error(
      "Erreur changement statut :",
      error
    );

    res.status(500).send(
      "Impossible de modifier le statut."
    );
  }

});

/* =========================================================
   MESSAGE
========================================================= */

app.post("/message", requireLogin, async (req, res) => {

  const id =
    String(req.body.id || "");

  const message =
    String(
      req.body.message || ""
    ).trim();

  if (!id || !message) {

    return res.redirect(
      `/request?id=${encodeURIComponent(id)}`
    );

  }

  try {

    const { error } =
      await supabase
        .from("messages")
        .insert({
          demande_id: id,
          auteur: "Service Informatique",
          message
        });

    if (error) {
      throw error;
    }

    res.redirect(
      `/request?id=${encodeURIComponent(id)}`
    );

  } catch (error) {

    console.error(
      "Erreur message :",
      error
    );

    res.status(500).send(
      "Impossible d'envoyer le message."
    );
  }

});

/* =========================================================
   SERVEUR
========================================================= */

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `DDI HELPDESK lancé sur le port ${PORT}`
    );

  }
);
