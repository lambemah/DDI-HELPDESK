const express = require("express");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let requests = [
  {
    id: "DDI-0025",
    nom: "Mamadou",
    service: "Comptabilité",
    sujet: "Ordinateur ne démarre plus",
    description: "Mon ordinateur ne démarre plus depuis ce matin.",
    status: "En cours",
    date: "08/09/2026",
    messages: [
      {
        auteur: "Mamadou",
        texte: "Mon ordinateur ne démarre plus depuis ce matin.",
        date: "08/09/2026 08:15"
      },
      {
        auteur: "Service Informatique",
        texte: "Nous avons pris votre demande en charge.",
        date: "08/09/2026 08:30"
      }
    ]
  },
  {
    id: "DDI-0024",
    nom: "Fanta",
    service: "RH",
    sujet: "Imprimante en panne",
    description: "L'imprimante du service RH ne fonctionne plus.",
    status: "Nouveau",
    date: "08/09/2026",
    messages: [
      {
        auteur: "Fanta",
        texte: "L'imprimante du service RH ne fonctionne plus.",
        date: "08/09/2026 09:10"
      }
    ]
  },
  {
    id: "DDI-0023",
    nom: "Aïssata",
    service: "Direction",
    sujet: "Problème de connexion Internet",
    description: "La connexion Internet est très lente.",
    status: "Terminé",
    date: "07/09/2026",
    messages: [
      {
        auteur: "Aïssata",
        texte: "La connexion Internet est très lente.",
        date: "07/09/2026 10:20"
      },
      {
        auteur: "Service Informatique",
        texte: "Le problème a été résolu.",
        date: "07/09/2026 11:05"
      }
    ]
  },
  {
    id: "DDI-0022",
    nom: "Paul",
    service: "Commercial",
    sujet: "Problème de messagerie",
    description: "Je n'arrive pas à accéder à ma messagerie.",
    status: "Non traité",
    date: "06/09/2026",
    messages: [
      {
        auteur: "Paul",
        texte: "Je n'arrive pas à accéder à ma messagerie.",
        date: "06/09/2026 14:00"
      }
    ]
  }
];

let nextId = 26;

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

function stats() {
  return {
    total: requests.length,
    nouveau: requests.filter(r => r.status === "Nouveau").length,
    cours: requests.filter(r => r.status === "En cours").length,
    termine: requests.filter(r => r.status === "Terminé").length,
    nontraite: requests.filter(r => r.status === "Non traité").length
  };
}

function sidebar(active = "dashboard") {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">D</div>
        <div>
          <strong>DDI</strong>
          <span>HELPDESK</span>
        </div>
      </div>

      <div class="menu-title">MENU</div>

      <a href="/" class="menu-item ${active === "dashboard" ? "active" : ""}">
        <span>▦</span>
        <span>Tableau de bord</span>
      </a>

      <a href="/canal" class="menu-item ${active === "canal" ? "active" : ""}">
        <span>💬</span>
        <span>Canal DDI</span>
      </a>

      <a href="/new" class="menu-item ${active === "new" ? "active" : ""}">
        <span>＋</span>
        <span>Nouvelle demande</span>
      </a>

      <a href="/requests" class="menu-item ${active === "requests" ? "active" : ""}">
        <span>☷</span>
        <span>Toutes les demandes</span>
      </a>

      <a href="/notifications" class="menu-item ${active === "notifications" ? "active" : ""}">
        <span>♢</span>
        <span>Notifications</span>
      </a>

      <a href="/users" class="menu-item ${active === "users" ? "active" : ""}">
        <span>♙</span>
        <span>Utilisateurs</span>
      </a>

      <div class="sidebar-bottom">
        <div class="online">
          <span class="online-dot"></span>
          Service Informatique
        </div>

        <a href="/" class="logout">
          ⇥ Déconnexion
        </a>
      </div>
    </aside>
  `;
}

function layout(content, active = "dashboard") {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
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

/* BARS */

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

/* CIRCLE */

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
  background: conic-gradient(#19a463 0deg, #19a463 var(--degree), #edf2f7 var(--degree), #edf2f7 360deg);
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

/* RECENT */

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

/* CANAL */

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

.status-btn:hover {
  border-color: #087ee8;
  color: #087ee8;
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
      DDI HELPDESK / <strong>${active === "dashboard" ? "Tableau de bord" : active === "canal" ? "Canal DDI" : active === "new" ? "Nouvelle demande" : "Gestion"}</strong>
    </div>

    <div class="user">
      <span>Service Informatique</span>
      <div class="avatar">IT</div>
    </div>
  </header>

  ${content}

</main>
</div>
</body>
</html>
`;
}

/* =========================
   TABLEAU DE BORD
========================= */

function dashboardPage() {
  const s = stats();

  const resolutionRate =
    s.total === 0 ? 0 : Math.round((s.termine / s.total) * 100);

  const degree = Math.round((resolutionRate / 100) * 360);

  const services = {};

  requests.forEach(r => {
    services[r.service] = (services[r.service] || 0) + 1;
  });

  const serviceRows = Object.entries(services)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxService =
    serviceRows.length ? Math.max(...serviceRows.map(x => x[1])) : 1;

  const recent = requests.slice(0, 5);

  return layout(`
    <section class="content">

      <div class="page-title">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vue globale du suivi des demandes informatiques</p>
        </div>

        <a href="/new" class="btn">＋ Nouvelle demande</a>
      </div>

      <div class="stat-grid">

        <div class="stat-card">
          <div class="stat-label">TOTAL DES REQUÊTES</div>
          <div class="stat-number blue">${s.total}</div>
          <div class="stat-sub">Toutes les demandes</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">NOUVELLES</div>
          <div class="stat-number blue">${s.nouveau}</div>
          <div class="stat-sub">À prendre en charge</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">EN COURS</div>
          <div class="stat-number orange">${s.cours}</div>
          <div class="stat-sub">Interventions en cours</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">TERMINÉES</div>
          <div class="stat-number green">${s.termine}</div>
          <div class="stat-sub">Demandes résolues</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">NON TRAITÉES</div>
          <div class="stat-number red">${s.nontraite}</div>
          <div class="stat-sub">En attente d'intervention</div>
        </div>

      </div>

      <div class="dashboard-grid">

        <div class="panel">
          <div class="panel-header">
            <h2>Répartition des demandes</h2>
            <span>Suivi actuel</span>
          </div>

          <div class="panel-body">

            <div class="bar-row">
              <div class="bar-info">
                <span>🆕 Nouvelles</span>
                <span>${s.nouveau}</span>
              </div>
              <div class="bar">
                <div class="bar-fill" style="width:${s.total ? (s.nouveau / s.total) * 100 : 0}%"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-info">
                <span>🔵 En cours</span>
                <span>${s.cours}</span>
              </div>
              <div class="bar">
                <div class="bar-fill orange" style="width:${s.total ? (s.cours / s.total) * 100 : 0}%"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-info">
                <span>🟢 Terminées</span>
                <span>${s.termine}</span>
              </div>
              <div class="bar">
                <div class="bar-fill green" style="width:${s.total ? (s.termine / s.total) * 100 : 0}%"></div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-info">
                <span>🔴 Non traitées</span>
                <span>${s.nontraite}</span>
              </div>
              <div class="bar">
                <div class="bar-fill red" style="width:${s.total ? (s.nontraite / s.total) * 100 : 0}%"></div>
              </div>
            </div>

          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h2>Taux de résolution</h2>
            <span>Global</span>
          </div>

          <div class="panel-body resolution">

            <div class="circle" style="--degree:${degree}deg">
              <div class="circle-value">${resolutionRate}%</div>
            </div>

            <div class="resolution-text">
              ${s.termine} demande(s) terminée(s) sur ${s.total}
            </div>

          </div>
        </div>

      </div>

      <div class="dashboard-grid">

        <div class="panel">
          <div class="panel-header">
            <h2>Demandes par service</h2>
            <span>Services les plus concernés</span>
          </div>

          <div class="panel-body">

            ${
              serviceRows.length
                ? serviceRows.map(([service, count]) => `
                    <div class="bar-row">
                      <div class="bar-info">
                        <span>${escapeHtml(service)}</span>
                        <span>${count}</span>
                      </div>

                      <div class="bar">
                        <div
                          class="bar-fill"
                          style="width:${(count / maxService) * 100}%">
                        </div>
                      </div>
                    </div>
                  `).join("")
                : `<div class="empty">Aucune donnée disponible.</div>`
            }

          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h2>Indicateur IT</h2>
            <span>Situation actuelle</span>
          </div>

          <div class="panel-body">

            <div class="bar-row">
              <div class="bar-info">
                <span>Demandes prises en charge</span>
                <span>${s.cours + s.termine}</span>
              </div>

              <div class="bar">
                <div
                  class="bar-fill green"
                  style="width:${s.total ? ((s.cours + s.termine) / s.total) * 100 : 0}%">
                </div>
              </div>
            </div>

            <div class="bar-row">
              <div class="bar-info">
                <span>Demandes en attente</span>
                <span>${s.nouveau + s.nontraite}</span>
              </div>

              <div class="bar">
                <div
                  class="bar-fill red"
                  style="width:${s.total ? ((s.nouveau + s.nontraite) / s.total) * 100 : 0}%">
                </div>
              </div>
            </div>

            <div style="margin-top:25px;padding:15px;background:#f6f9fc;border-radius:10px;">
              <div style="font-size:12px;color:#718096;margin-bottom:6px;">
                État du service informatique
              </div>

              <div style="font-size:18px;font-weight:700;">
                ${s.nontraite > 0 ? "Des demandes nécessitent une attention" : "Toutes les demandes sont prises en charge"}
              </div>
            </div>

          </div>
        </div>

      </div>

      <div class="panel">

        <div class="panel-header">
          <h2>Dernières demandes</h2>
          <a href="/requests" style="color:#087ee8;font-size:12px;">
            Voir toutes les demandes →
          </a>
        </div>

        ${
          recent.length
            ? `
              <table class="recent">
                <thead>
                  <tr>
                    <th>RÉFÉRENCE</th>
                    <th>DEMANDEUR</th>
                    <th>SERVICE</th>
                    <th>DEMANDE</th>
                    <th>STATUT</th>
                  </tr>
                </thead>

                <tbody>

                  ${recent.map(r => `
                    <tr>
                      <td>
                        <a href="/request?id=${encodeURIComponent(r.id)}" class="id">
                          ${escapeHtml(r.id)}
                        </a>
                      </td>

                      <td>${escapeHtml(r.nom)}</td>

                      <td>${escapeHtml(r.service)}</td>

                      <td>${escapeHtml(r.sujet)}</td>

                      <td>
                        <span class="status ${statusClass(r.status)}">
                          ${escapeHtml(r.status)}
                        </span>
                      </td>
                    </tr>
                  `).join("")}

                </tbody>
              </table>
            `
            : `<div class="empty">Aucune demande enregistrée.</div>`
        }

      </div>

    </section>
  `, "dashboard");
}

/* =========================
   CANAL DDI
========================= */

function canalPage() {
  return layout(`
    <section class="content">

      <div class="page-title">
        <div>
          <h1>Canal DDI</h1>
          <p>Les demandes informatiques reçues par le service IT</p>
        </div>

        <a href="/new" class="btn">＋ Nouvelle demande</a>
      </div>

      <div class="request-list">

        ${
          requests.length
            ? requests.map(r => `
              <a href="/request?id=${encodeURIComponent(r.id)}" class="request-card">

                <div class="request-left">

                  <div class="request-avatar">
                    ${escapeHtml(r.nom.charAt(0).toUpperCase())}
                  </div>

                  <div>
                    <div class="request-name">
                      ${escapeHtml(r.nom)}
                    </div>

                    <div class="request-meta">
                      ${escapeHtml(r.service)} · ${escapeHtml(r.date)}
                    </div>

                    <div class="request-subject">
                      ${escapeHtml(r.sujet)}
                    </div>
                  </div>

                </div>

                <div class="request-right">

                  <span class="status ${statusClass(r.status)}">
                    ${escapeHtml(r.status)}
                  </span>

                  <div style="font-size:10px;color:#9aa4b2;margin-top:7px;">
                    ${escapeHtml(r.id)}
                  </div>

                </div>

              </a>
            `).join("")
            : `<div class="empty">Aucune demande.</div>`
        }

      </div>

    </section>
  `, "canal");
}

/* =========================
   TOUTES LES DEMANDES
========================= */

function requestsPage() {
  return layout(`
    <section class="content">

      <div class="page-title">
        <div>
          <h1>Toutes les demandes</h1>
          <p>Historique complet des demandes informatiques</p>
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

                  ${requests.map(r => `
                    <tr>

                      <td>
                        <a href="/request?id=${encodeURIComponent(r.id)}" class="id">
                          ${escapeHtml(r.id)}
                        </a>
                      </td>

                      <td>${escapeHtml(r.nom)}</td>
                      <td>${escapeHtml(r.service)}</td>
                      <td>${escapeHtml(r.sujet)}</td>
                      <td>${escapeHtml(r.date)}</td>

                      <td>
                        <span class="status ${statusClass(r.status)}">
                          ${escapeHtml(r.status)}
                        </span>
                      </td>

                    </tr>
                  `).join("")}

                </tbody>

              </table>
            `
            : `<div class="empty">Aucune demande enregistrée.</div>`
        }

      </div>

    </section>
  `, "requests");
}

/* =========================
   NOUVELLE DEMANDE
========================= */

function newPage() {
  return layout(`
    <section class="content">

      <div class="page-title">
        <div>
          <h1>Nouvelle demande</h1>
          <p>Enregistrer une nouvelle demande informatique</p>
        </div>
      </div>

      <div class="form-box">

        <form method="POST" action="/new">

          <div class="form-group">
            <label>Nom du demandeur</label>
            <input
              type="text"
              name="nom"
              placeholder="Ex : Mamadou"
              required>
          </div>

          <div class="form-group">
            <label>Service</label>

            <select name="service" required>
              <option value="">Choisir le service</option>
              <option>Direction</option>
              <option>Ressources Humaines</option>
              <option>Comptabilité</option>
              <option>Commercial</option>
              <option>Administration</option>
              <option>Autre</option>
            </select>
          </div>

          <div class="form-group">
            <label>Objet de la demande</label>

            <input
              type="text"
              name="sujet"
              placeholder="Ex : Ordinateur en panne"
              required>
          </div>

          <div class="form-group">
            <label>Description</label>

            <textarea
              name="description"
              placeholder="Décrivez le problème rencontré..."
              required></textarea>
          </div>

          <button class="btn" type="submit">
            Envoyer la demande
          </button>

        </form>

      </div>

    </section>
  `, "new");
}

/* =========================
   CONVERSATION
========================= */

function requestPage(id) {
  const request = requests.find(r => r.id === id);

  if (!request) {
    return layout(`
      <section class="content">
        <div class="empty">
          <h2>Demande introuvable</h2>
          <br>
          <a href="/canal" class="btn">Retour au canal</a>
        </div>
      </section>
    `, "canal");
  }

  return layout(`
    <section class="content">

      <a href="/canal" class="back">
        ← Retour au Canal DDI
      </a>

      <div class="conversation">

        <div class="conversation-header">

          <div class="conversation-title">
            <strong>${escapeHtml(request.sujet)}</strong>

            <span>
              ${escapeHtml(request.id)} ·
              ${escapeHtml(request.nom)} ·
              ${escapeHtml(request.service)}
            </span>
          </div>

          <span class="status ${statusClass(request.status)}">
            ${escapeHtml(request.status)}
          </span>

        </div>

        <div class="messages">

          ${
            request.messages && request.messages.length
              ? request.messages.map(m => `
                  <div class="message ${m.auteur === "Service Informatique" ? "me" : ""}">

                    <div class="message-author">
                      ${escapeHtml(m.auteur)}
                    </div>

                    <div class="message-text">
                      ${escapeHtml(m.texte)}
                    </div>

                    <div class="message-date">
                      ${escapeHtml(m.date)}
                    </div>

                  </div>
                `).join("")
              : `
                <div class="empty">
                  Aucun message.
                </div>
              `
          }

        </div>

        <div class="status-actions">

          <span>Changer le statut :</span>

          <form method="POST" action="/status">
            <input type="hidden" name="id" value="${escapeHtml(request.id)}">
            <input type="hidden" name="status" value="Nouveau">
            <button class="status-btn">🆕 Nouveau</button>
          </form>

          <form method="POST" action="/status">
            <input type="hidden" name="id" value="${escapeHtml(request.id)}">
            <input type="hidden" name="status" value="En cours">
            <button class="status-btn">🔵 En cours</button>
          </form>

          <form method="POST" action="/status">
            <input type="hidden" name="id" value="${escapeHtml(request.id)}">
            <input type="hidden" name="status" value="Terminé">
            <button class="status-btn">🟢 Terminé</button>
          </form>

          <form method="POST" action="/status">
            <input type="hidden" name="id" value="${escapeHtml(request.id)}">
            <input type="hidden" name="status" value="Non traité">
            <button class="status-btn">🔴 Non traité</button>
          </form>

        </div>

        <form method="POST" action="/message" class="message-form">

          <input
            type="hidden"
            name="id"
            value="${escapeHtml(request.id)}">

          <input
            type="text"
            name="message"
            placeholder="Écrire un message..."
            required>

          <button class="btn" type="submit">
            Envoyer
          </button>

        </form>

      </div>

    </section>
  `, "canal");
}

/* =========================
   NOTIFICATIONS
========================= */

function notificationsPage() {
  const pending = requests.filter(
    r => r.status === "Nouveau" || r.status === "Non traité"
  );

  return layout(`
    <section class="content">

      <div class="page-title">
        <div>
          <h1>Notifications</h1>
          <p>Demandes nécessitant une attention</p>
        </div>
      </div>

      <div class="panel">

        ${
          pending.length
            ? pending.map(r => `
                <a
                  href="/request?id=${encodeURIComponent(r.id)}"
                  style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding:18px;
                    border-bottom:1px solid #edf1f5;
                  "
                >

                  <div>
                    <strong>${escapeHtml(r.id)}</strong>
                    <div style="font-size:12px;color:#718096;margin-top:5px;">
                      ${escapeHtml(r.nom)} · ${escapeHtml(r.sujet)}
                    </div>
                  </div>

                  <span class="status ${statusClass(r.status)}">
                    ${escapeHtml(r.status)}
                  </span>

                </a>
              `).join("")
            : `<div class="empty">Aucune notification.</div>`
        }

      </div>

    </section>
  `, "notifications");
}

/* =========================
   UTILISATEURS
========================= */

function usersPage() {
  const users = [
    ["Service Informatique", "IT", "Administrateur"],
    ["Direction", "Direction", "Consultation"],
    ["Ressources Humaines", "RH", "Consultation"]
  ];

  return layout(`
    <section class="content">

      <div class="page-title">
        <div>
          <h1>Utilisateurs</h1>
          <p>Gestion des accès à DDI HELPDESK</p>
        </div>
      </div>

      <div class="panel">

        <table class="recent">

          <thead>
            <tr>
              <th>UTILISATEUR</th>
              <th>SERVICE</th>
              <th>RÔLE</th>
            </tr>
          </thead>

          <tbody>

            ${users.map(u => `
              <tr>
                <td>${escapeHtml(u[0])}</td>
                <td>${escapeHtml(u[1])}</td>
                <td>${escapeHtml(u[2])}</td>
              </tr>
            `).join("")}

          </tbody>

        </table>

      </div>

    </section>
  `, "users");
}

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.send(dashboardPage());
});

app.get("/canal", (req, res) => {
  res.send(canalPage());
});

app.get("/requests", (req, res) => {
  res.send(requestsPage());
});

app.get("/new", (req, res) => {
  res.send(newPage());
});

app.get("/request", (req, res) => {
  res.send(requestPage(req.query.id));
});

app.get("/notifications", (req, res) => {
  res.send(notificationsPage());
});

app.get("/users", (req, res) => {
  res.send(usersPage());
});

/* =========================
   CRÉER UNE DEMANDE
========================= */

app.post("/new", (req, res) => {
  const { nom, service, sujet, description } = req.body;

  const request = {
    id: `DDI-${String(nextId).padStart(4, "0")}`,
    nom: nom || "Inconnu",
    service: service || "Non précisé",
    sujet: sujet || "Sans objet",
    description: description || "",
    status: "Nouveau",
    date: new Date().toLocaleDateString("fr-FR"),
    messages: [
      {
        auteur: nom || "Inconnu",
        texte: description || sujet || "",
        date: new Date().toLocaleString("fr-FR")
      }
    ]
  };

  requests.unshift(request);
  nextId++;

  res.redirect(`/request?id=${encodeURIComponent(request.id)}`);
});

/* =========================
   CHANGER LE STATUT
========================= */

app.post("/status", (req, res) => {
  const { id, status } = req.body;

  const request = requests.find(r => r.id === id);

  if (request) {
    request.status = status;

    request.messages.push({
      auteur: "Service Informatique",
      texte: `Statut de la demande changé en : ${status}`,
      date: new Date().toLocaleString("fr-FR")
    });
  }

  res.redirect(`/request?id=${encodeURIComponent(id)}`);
});

/* =========================
   MESSAGE
========================= */

app.post("/message", (req, res) => {
  const { id, message } = req.body;

  const request = requests.find(r => r.id === id);

  if (request && message) {
    request.messages.push({
      auteur: "Service Informatique",
      texte: message,
      date: new Date().toLocaleString("fr-FR")
    });
  }

  res.redirect(`/request?id=${encodeURIComponent(id)}`);
});

/* =========================
   SERVEUR
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DDI HELPDESK lancé sur le port ${PORT}`);
});
