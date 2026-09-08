const express = require("express");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================
   DONNÉES DE DÉMONSTRATION
========================= */

let requests = [
  {
    id: "DDI-0025",
    name: "Mamadou",
    service: "Comptabilité",
    subject: "Ordinateur",
    message: "Mon ordinateur ne démarre plus depuis ce matin.",
    status: "En cours",
    time: "10:25",
    messages: [
      {
        sender: "Mamadou",
        role: "Employé",
        text: "Mon ordinateur ne démarre plus depuis ce matin.",
        time: "10:25",
        type: "employee"
      },
      {
        sender: "Service Informatique",
        role: "IT",
        text: "Votre demande est prise en charge. Nous allons vérifier votre ordinateur.",
        time: "10:30",
        type: "it"
      }
    ]
  },
  {
    id: "DDI-0024",
    name: "Fanta",
    service: "Ressources Humaines",
    subject: "Imprimante",
    message: "L'imprimante ne fonctionne plus.",
    status: "Nouveau",
    time: "09:40",
    messages: [
      {
        sender: "Fanta",
        role: "Employée",
        text: "L'imprimante ne fonctionne plus.",
        time: "09:40",
        type: "employee"
      }
    ]
  },
  {
    id: "DDI-0023",
    name: "Aïssata",
    service: "Direction",
    subject: "Internet",
    message: "Je n'arrive plus à me connecter à Internet.",
    status: "Terminé",
    time: "09:15",
    messages: [
      {
        sender: "Aïssata",
        role: "Direction",
        text: "Je n'arrive plus à me connecter à Internet.",
        time: "09:15",
        type: "employee"
      },
      {
        sender: "Service Informatique",
        role: "IT",
        text: "Le problème de connexion est résolu.",
        time: "09:50",
        type: "it"
      }
    ]
  },
  {
    id: "DDI-0022",
    name: "Paul",
    service: "Commercial",
    subject: "Email",
    message: "Je n'arrive plus à accéder à ma boîte mail.",
    status: "Non traité",
    time: "08:50",
    messages: [
      {
        sender: "Paul",
        role: "Commercial",
        text: "Je n'arrive plus à accéder à ma boîte mail.",
        time: "08:50",
        type: "employee"
      }
    ]
  }
];

let nextId = 26;

/* =========================
   OUTILS
========================= */

function escapeHtml(text) {
  if (!text) return "";

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
  return "untreated";
}

function statusIcon(status) {
  if (status === "Nouveau") return "🆕";
  if (status === "En cours") return "🔵";
  if (status === "Terminé") return "🟢";
  return "🔴";
}

function getCounts() {
  return {
    nouveau: requests.filter(r => r.status === "Nouveau").length,
    progress: requests.filter(r => r.status === "En cours").length,
    done: requests.filter(r => r.status === "Terminé").length,
    untreated: requests.filter(r => r.status === "Non traité").length
  };
}

/* =========================
   PAGE PRINCIPALE
========================= */

function renderApp(selectedId, view = "all") {
  const counts = getCounts();

  let filteredRequests = [...requests];

  if (view === "new") {
    filteredRequests = requests.filter(r => r.status === "Nouveau");
  }

  if (view === "progress") {
    filteredRequests = requests.filter(r => r.status === "En cours");
  }

  if (view === "done") {
    filteredRequests = requests.filter(r => r.status === "Terminé");
  }

  if (view === "untreated") {
    filteredRequests = requests.filter(r => r.status === "Non traité");
  }

  const selected =
    requests.find(r => r.id === selectedId) ||
    filteredRequests[0] ||
    requests[0];

  const activeId = selected ? selected.id : "";

  const requestList = filteredRequests.length
    ? filteredRequests
        .map(
          r => `
          <a class="request-item ${r.id === activeId ? "active" : ""}"
             href="/?id=${encodeURIComponent(r.id)}&view=${encodeURIComponent(view)}">

            <div class="avatar">${escapeHtml(r.name.charAt(0).toUpperCase())}</div>

            <div class="request-content">
              <div class="request-top">
                <strong>${escapeHtml(r.name)}</strong>
                <span>${escapeHtml(r.time)}</span>
              </div>

              <div class="service">${escapeHtml(r.service)}</div>

              <div class="subject">
                ${escapeHtml(r.message)}
              </div>

              <span class="status ${statusClass(r.status)}">
                ${statusIcon(r.status)} ${escapeHtml(r.status)}
              </span>
            </div>
          </a>
        `
        )
        .join("")
    : `
      <div class="empty-list">
        <div class="empty-icon">📭</div>
        <strong>Aucune demande</strong>
        <p>Il n'y a aucune demande dans cette catégorie.</p>
      </div>
    `;

  const conversation = selected
    ? selected.messages
        .map(
          m => `
          <div class="message-row ${m.type === "it" ? "it-message" : ""}">
            <div class="message ${m.type === "it" ? "message-it" : "message-employee"}">

              <div class="message-author">
                ${escapeHtml(m.sender)}
              </div>

              <div class="message-role">
                ${escapeHtml(m.role)}
              </div>

              <div class="message-text">
                ${escapeHtml(m.text)}
              </div>

              <div class="message-time">
                ${escapeHtml(m.time)}
              </div>

            </div>
          </div>
        `
        )
        .join("")
    : `
      <div class="no-conversation">
        Sélectionnez une demande.
      </div>
    `;

  const pageTitle =
    view === "new"
      ? "Nouvelles demandes"
      : view === "progress"
      ? "Demandes en cours"
      : view === "done"
      ? "Demandes terminées"
      : view === "untreated"
      ? "Demandes non traitées"
      : "Canal DDI";

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
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #f5f8fb;
  color: #172b3a;
}

a {
  text-decoration: none;
  color: inherit;
}

/* =========================
   STRUCTURE
========================= */

.app {
  display: flex;
  min-height: 100vh;
}

/* =========================
   SIDEBAR
========================= */

.sidebar {
  width: 285px;
  background: #1478ad;
  color: white;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.brand {
  padding: 35px 28px 28px;
  border-bottom: 1px solid rgba(255,255,255,.15);
}

.brand-box {
  display: flex;
  align-items: center;
  gap: 15px;
}

.brand-logo {
  width: 58px;
  height: 58px;
  border-radius: 15px;
  background: white;
  color: #1478ad;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 27px;
  font-weight: bold;
}

.brand h1 {
  margin: 0;
  font-size: 21px;
}

.brand p {
  margin: 5px 0 0;
  font-size: 14px;
  opacity: .85;
}

.menu {
  padding: 25px 12px;
}

.menu a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 16px;
  margin-bottom: 5px;
  border-radius: 13px;
  font-size: 15px;
  font-weight: 600;
  transition: .2s;
}

.menu a:hover {
  background: rgba(255,255,255,.12);
}

.menu a.active {
  background: rgba(255,255,255,.19);
}

.menu-icon {
  width: 25px;
  text-align: center;
  font-size: 18px;
}

/* =========================
   MAIN
========================= */

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* =========================
   TOPBAR
========================= */

.topbar {
  height: 105px;
  background: white;
  border-bottom: 1px solid #e3ebf2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 35px;
}

.top-title h2 {
  margin: 0;
  font-size: 28px;
}

.top-title p {
  margin: 5px 0 0;
  color: #718096;
}

.user {
  display: flex;
  align-items: center;
  gap: 13px;
}

.user-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #e5f3fc;
  color: #1478ad;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
}

.user strong {
  display: block;
}

.user span {
  color: #778899;
  font-size: 14px;
}

/* =========================
   CONTENT
========================= */

.content {
  padding: 28px;
  flex: 1;
  min-height: 0;
}

/* =========================
   STAT CARDS
========================= */

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 25px;
}

.stat {
  background: white;
  border: 1px solid #e3ebf2;
  border-radius: 17px;
  padding: 18px 20px;
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-icon {
  font-size: 23px;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
}

.stat-label {
  color: #718096;
  margin-top: 5px;
}

/* =========================
   HELP DESK
========================= */

.helpdesk {
  background: white;
  border: 1px solid #e1e9f0;
  border-radius: 18px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 340px 1fr;
  min-height: 610px;
}

/* =========================
   REQUEST LIST
========================= */

.requests-panel {
  border-right: 1px solid #e1e9f0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.requests-header {
  padding: 22px;
  border-bottom: 1px solid #e8eef3;
}

.requests-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.requests-title h3 {
  margin: 0;
  font-size: 20px;
}

.counter {
  background: #e7f3fb;
  color: #1478ad;
  padding: 6px 11px;
  border-radius: 20px;
  font-weight: bold;
}

.new-button {
  display: block;
  margin-top: 15px;
  background: #1478ad;
  color: white;
  padding: 13px;
  border-radius: 11px;
  text-align: center;
  font-weight: bold;
}

.request-list {
  overflow-y: auto;
  flex: 1;
}

.request-item {
  display: flex;
  gap: 13px;
  padding: 17px;
  border-bottom: 1px solid #edf1f4;
}

.request-item:hover {
  background: #f7fbfe;
}

.request-item.active {
  background: #edf7fd;
  border-left: 4px solid #1478ad;
  padding-left: 13px;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #edf2f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #1478ad;
  flex-shrink: 0;
}

.request-content {
  min-width: 0;
  flex: 1;
}

.request-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.request-top strong {
  font-size: 15px;
}

.request-top span {
  color: #91a0ad;
  font-size: 12px;
}

.service {
  color: #758696;
  font-size: 13px;
  margin: 3px 0 8px;
}

.subject {
  color: #536575;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 9px;
}

.status {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.status.new {
  background: #fff6d9;
  color: #a97800;
}

.status.progress {
  background: #e6f4ff;
  color: #1478ad;
}

.status.done {
  background: #e7faef;
  color: #1b8a50;
}

.status.untreated {
  background: #ffe8eb;
  color: #c6384d;
}

/* =========================
   CONVERSATION
========================= */

.conversation-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.conversation-header {
  min-height: 85px;
  padding: 17px 25px;
  border-bottom: 1px solid #e7edf2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.person {
  display: flex;
  align-items: center;
  gap: 13px;
}

.person-avatar {
  width: 48px;
  height: 48px;
  background: #e8f4fb;
  color: #1478ad;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.person h3 {
  margin: 0;
  font-size: 18px;
}

.person p {
  margin: 4px 0 0;
  color: #788895;
  font-size: 13px;
}

.ticket-status {
  text-align: right;
}

.ticket-number {
  display: block;
  font-weight: bold;
  color: #536575;
  margin-bottom: 6px;
  font-size: 13px;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  background: #f3f8fc;
}

.message-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 18px;
}

.message-row.it-message {
  justify-content: flex-end;
}

.message {
  max-width: 70%;
  padding: 13px 16px;
  border-radius: 15px;
  background: white;
  box-shadow: 0 2px 8px rgba(30,70,100,.06);
}

.message-it {
  background: #e2f2fc;
}

.message-author {
  color: #1478ad;
  font-size: 13px;
  font-weight: bold;
}

.message-role {
  color: #82909b;
  font-size: 11px;
  margin-top: 2px;
}

.message-text {
  margin-top: 8px;
  line-height: 1.5;
  color: #263c4c;
}

.message-time {
  text-align: right;
  color: #91a0aa;
  font-size: 10px;
  margin-top: 7px;
}

/* =========================
   INTERVENTION
========================= */

.intervention {
  border-top: 1px solid #e4ebf0;
  padding: 17px 20px;
  background: white;
}

.intervention-title {
  font-size: 11px;
  color: #82909b;
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 9px;
}

.status-actions {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-bottom: 13px;
}

.status-form {
  display: inline;
}

.status-button {
  border: 1px solid #dbe5ec;
  background: white;
  padding: 7px 10px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 12px;
}

.status-button:hover {
  background: #f2f8fc;
}

.message-form {
  display: flex;
  gap: 10px;
}

.message-input {
  flex: 1;
  border: 1px solid #dce6ed;
  border-radius: 12px;
  padding: 12px 14px;
  outline: none;
  font-size: 14px;
}

.message-input:focus {
  border-color: #1478ad;
}

.send-button {
  width: 45px;
  border: 0;
  border-radius: 12px;
  background: #1478ad;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

/* =========================
   EMPTY
========================= */

.empty-list {
  text-align: center;
  padding: 60px 20px;
  color: #7c8b97;
}

.empty-icon {
  font-size: 35px;
  margin-bottom: 12px;
}

.empty-list p {
  font-size: 13px;
}

.no-conversation {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #83919c;
}

/* =========================
   MOBILE
========================= */

@media (max-width: 950px) {

  .sidebar {
    width: 230px;
  }

  .helpdesk {
    grid-template-columns: 290px 1fr;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {

  .app {
    display: block;
  }

  .sidebar {
    width: 100%;
    min-height: auto;
  }

  .brand {
    padding: 18px;
  }

  .menu {
    display: flex;
    overflow-x: auto;
    padding: 10px;
    gap: 5px;
  }

  .menu a {
    white-space: nowrap;
    margin: 0;
    padding: 11px 12px;
  }

  .menu a span:last-child {
    display: none;
  }

  .main {
    width: 100%;
  }

  .topbar {
    height: auto;
    padding: 18px;
  }

  .top-title h2 {
    font-size: 22px;
  }

  .user {
    display: none;
  }

  .content {
    padding: 12px;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat {
    padding: 14px;
  }

  .stat-number {
    font-size: 22px;
  }

  .helpdesk {
    display: block;
    min-height: auto;
  }

  .requests-panel {
    border-right: 0;
    max-height: 380px;
  }

  .conversation-panel {
    min-height: 580px;
  }

  .message {
    max-width: 85%;
  }

  .conversation-header {
    padding: 15px;
  }

  .messages {
    padding: 18px;
  }
}

</style>
</head>

<body>

<div class="app">

  <!-- =========================
       MENU GAUCHE
  ========================== -->

  <aside class="sidebar">

    <div class="brand">

      <div class="brand-box">

        <div class="brand-logo">
          D
        </div>

        <div>
          <h1>DDI HELPDESK</h1>
          <p>Assistance Informatique</p>
        </div>

      </div>

    </div>

    <nav class="menu">

      <a href="/" class="${view === "all" ? "active" : ""}">
        <span class="menu-icon">💬</span>
        <span>Canal DDI</span>
      </a>

      <a href="/?view=new" class="${view === "new" ? "active" : ""}">
        <span class="menu-icon">➕</span>
        <span>Nouvelle demande</span>
      </a>

      <a href="/?view=all" class="${view === "all" ? "active" : ""}">
        <span class="menu-icon">📋</span>
        <span>Toutes les demandes</span>
      </a>

      <a href="/?view=progress" class="${view === "progress" ? "active" : ""}">
        <span class="menu-icon">🔵</span>
        <span>En cours</span>
      </a>

      <a href="/?view=done" class="${view === "done" ? "active" : ""}">
        <span class="menu-icon">🟢</span>
        <span>Terminées</span>
      </a>

      <a href="/?view=untreated" class="${view === "untreated" ? "active" : ""}">
        <span class="menu-icon">🔴</span>
        <span>Non traitées</span>
      </a>

      <a href="#">
        <span class="menu-icon">🔔</span>
        <span>Notifications</span>
      </a>

      <a href="#">
        <span class="menu-icon">📊</span>
        <span>Statistiques</span>
      </a>

      <a href="#">
        <span class="menu-icon">👥</span>
        <span>Utilisateurs</span>
      </a>

    </nav>

  </aside>


  <!-- =========================
       CONTENU
  ========================== -->

  <main class="main">

    <header class="topbar">

      <div class="top-title">

        <h2>${pageTitle}</h2>

        <p>
          Suivi simple des demandes d'assistance
        </p>

      </div>

      <div class="user">

        <div class="user-avatar">
          IT
        </div>

        <div>
          <strong>Service Informatique</strong>
          <span>Administrateur</span>
        </div>

      </div>

    </header>


    <section class="content">


      <!-- =========================
           STATISTIQUES RAPIDES
      ========================== -->

      <div class="stats">

        <div class="stat">

          <div class="stat-top">
            <span class="stat-icon">🆕</span>
            <span class="stat-number">${counts.nouveau}</span>
          </div>

          <div class="stat-label">
            Nouvelles
          </div>

        </div>


        <div class="stat">

          <div class="stat-top">
            <span class="stat-icon">🔵</span>
            <span class="stat-number">${counts.progress}</span>
          </div>

          <div class="stat-label">
            En cours
          </div>

        </div>


        <div class="stat">

          <div class="stat-top">
            <span class="stat-icon">🟢</span>
            <span class="stat-number">${counts.done}</span>
          </div>

          <div class="stat-label">
            Terminées
          </div>

        </div>


        <div class="stat">

          <div class="stat-top">
            <span class="stat-icon">🔴</span>
            <span class="stat-number">${counts.untreated}</span>
          </div>

          <div class="stat-label">
            Non traitées
          </div>

        </div>

      </div>


      <!-- =========================
           HELP DESK
      ========================== -->

      <div class="helpdesk">


        <!-- LISTE DES DEMANDES -->

        <div class="requests-panel">

          <div class="requests-header">

            <div class="requests-title">

              <h3>Demandes</h3>

              <span class="counter">
                ${filteredRequests.length}
              </span>

            </div>

            <a href="/?new=1" class="new-button">
              ➕ Nouvelle demande
            </a>

          </div>

          <div class="request-list">

            ${requestList}

          </div>

        </div>


        <!-- CONVERSATION -->

        <div class="conversation-panel">

          ${
            selected
              ? `

          <div class="conversation-header">

            <div class="person">

              <div class="person-avatar">
                ${escapeHtml(selected.name.charAt(0).toUpperCase())}
              </div>

              <div>

                <h3>
                  ${escapeHtml(selected.name)}
                </h3>

                <p>
                  ${escapeHtml(selected.service)}
                </p>

              </div>

            </div>

            <div class="ticket-status">

              <span class="ticket-number">
                ${escapeHtml(selected.id)}
              </span>

              <span class="status ${statusClass(selected.status)}">
                ${statusIcon(selected.status)}
                ${escapeHtml(selected.status)}
              </span>

            </div>

          </div>


          <div class="messages">

            ${conversation}

          </div>


          <div class="intervention">

            <div class="intervention-title">
              Intervention informatique
            </div>


            <div class="status-actions">

              <form method="POST" action="/status" class="status-form">
                <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
                <input type="hidden" name="status" value="Nouveau">
                <button class="status-button">
                  🆕 Nouveau
                </button>
              </form>

              <form method="POST" action="/status" class="status-form">
                <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
                <input type="hidden" name="status" value="En cours">
                <button class="status-button">
                  🔵 En cours
                </button>
              </form>

              <form method="POST" action="/status" class="status-form">
                <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
                <input type="hidden" name="status" value="Terminé">
                <button class="status-button">
                  🟢 Terminé
                </button>
              </form>

              <form method="POST" action="/status" class="status-form">
                <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
                <input type="hidden" name="status" value="Non traité">
                <button class="status-button">
                  🔴 Non traité
                </button>
              </form>

            </div>


            <form method="POST" action="/message" class="message-form">

              <input
                type="hidden"
                name="id"
                value="${escapeHtml(selected.id)}"
              >

              <input
                class="message-input"
                type="text"
                name="message"
                placeholder="Écrire une intervention..."
                required
              >

              <button class="send-button" type="submit">
                ➤
              </button>

            </form>

          </div>

          `
              : `
              <div class="no-conversation">
                Sélectionnez une demande.
              </div>
              `
          }

        </div>

      </div>

    </section>

  </main>

</div>

</body>
</html>
`;
}

/* =========================
   ROUTE PRINCIPALE
========================= */

app.get("/", (req, res) => {

  const view = req.query.view || "all";

  const selectedId = req.query.id || null;

  res.send(renderApp(selectedId, view));

});


/* =========================
   NOUVELLE DEMANDE
========================= */

app.get("/new", (req, res) => {

  res.send(`
<!DOCTYPE html>
<html lang="fr">

<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Nouvelle demande - DDI HELPDESK</title>

<style>

body {
  margin: 0;
  background: #f3f7fa;
  font-family: Arial, sans-serif;
  color: #183042;
}

.box {
  max-width: 600px;
  margin: 60px auto;
  background: white;
  padding: 35px;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(0,0,0,.07);
}

h1 {
  margin-top: 0;
}

label {
  display: block;
  margin-top: 18px;
  margin-bottom: 7px;
  font-weight: bold;
}

input,
select,
textarea {
  width: 100%;
  padding: 13px;
  border: 1px solid #dce6ed;
  border-radius: 10px;
  box-sizing: border-box;
  font-size: 14px;
}

textarea {
  min-height: 130px;
  resize: vertical;
}

button {
  margin-top: 22px;
  width: 100%;
  padding: 14px;
  background: #1478ad;
  border: 0;
  color: white;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}

.back {
  display: block;
  margin-top: 15px;
  text-align: center;
  color: #1478ad;
}

</style>

</head>

<body>

<div class="box">

<h1>➕ Nouvelle demande</h1>

<p>
Créer une nouvelle demande d'assistance informatique.
</p>

<form method="POST" action="/new">

<label>Nom du demandeur</label>

<input
  type="text"
  name="name"
  placeholder="Ex : Mamadou"
  required
>

<label>Service</label>

<select name="service" required>

<option value="">Sélectionner</option>
<option>Direction</option>
<option>Comptabilité</option>
<option>Ressources Humaines</option>
<option>Commercial</option>
<option>Administration</option>
<option>Autre</option>

</select>

<label>Type de problème</label>

<input
  type="text"
  name="subject"
  placeholder="Ex : Ordinateur, Internet, Imprimante..."
  required
>

<label>Description</label>

<textarea
  name="message"
  placeholder="Décrire le problème..."
  required
></textarea>

<button type="submit">
Créer la demande
</button>

</form>

<a class="back" href="/">
← Retour au Canal DDI
</a>

</div>

</body>

</html>
`);

});


/* =========================
   CREATION DEMANDE
========================= */

app.post("/new", (req, res) => {

  const {
    name,
    service,
    subject,
    message
  } = req.body;

  const id =
    "DDI-" +
    String(nextId++).padStart(4, "0");

  const newRequest = {

    id,

    name:
      String(name || "Inconnu").trim(),

    service:
      String(service || "Non précisé").trim(),

    subject:
      String(subject || "Assistance").trim(),

    message:
      String(message || "").trim(),

    status: "Nouveau",

    time:
      new Date().toLocaleTimeString(
        "fr-FR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      ),

    messages: [

      {
        sender:
          String(name || "Employé").trim(),

        role: "Employé",

        text:
          String(message || "").trim(),

        time:
          new Date().toLocaleTimeString(
            "fr-FR",
            {
              hour: "2-digit",
              minute: "2-digit"
            }
          ),

        type: "employee"
      }

    ]

  };

  requests.unshift(newRequest);

  res.redirect("/?id=" + encodeURIComponent(id));

});


/* =========================
   CHANGEMENT DE STATUT
========================= */

app.post("/status", (req, res) => {

  const {
    id,
    status
  } = req.body;

  const request =
    requests.find(r => r.id === id);

  if (request) {

    request.status = status;

    request.messages.push({

      sender: "Service Informatique",

      role: "IT",

      text:
        "Statut de la demande changé en : " +
        status,

      time:
        new Date().toLocaleTimeString(
          "fr-FR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        ),

      type: "it"

    });

  }

  res.redirect(
    "/?id=" +
    encodeURIComponent(id)
  );

});


/* =========================
   MESSAGE IT
========================= */

app.post("/message", (req, res) => {

  const {
    id,
    message
  } = req.body;

  const request =
    requests.find(r => r.id === id);

  if (request && message && message.trim()) {

    request.messages.push({

      sender: "Service Informatique",

      role: "IT",

      text: message.trim(),

      time:
        new Date().toLocaleTimeString(
          "fr-FR",
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        ),

      type: "it"

    });

    if (request.status === "Nouveau") {
      request.status = "En cours";
    }

  }

  res.redirect(
    "/?id=" +
    encodeURIComponent(id)
  );

});


/* =========================
   SERVEUR
========================= */

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    "DDI HELPDESK démarré sur le port " + PORT
  );

});
