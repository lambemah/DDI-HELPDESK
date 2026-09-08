const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let requests = [
  {
    id: "DDI-0025",
    name: "Mamadou",
    service: "Comptabilité",
    message: "Mon ordinateur ne démarre plus depuis ce matin.",
    status: "En cours",
    time: "10:25",
  },
  {
    id: "DDI-0024",
    name: "Fanta",
    service: "Ressources Humaines",
    message: "L'imprimante ne fonctionne plus.",
    status: "Nouveau",
    time: "09:40",
  },
  {
    id: "DDI-0023",
    name: "Aïssata",
    service: "Direction",
    message: "Je n'arrive plus à me connecter à Internet.",
    status: "Terminé",
    time: "09:15",
  },
  {
    id: "DDI-0022",
    name: "Paul",
    service: "Commercial",
    message: "Ma messagerie professionnelle ne fonctionne pas.",
    status: "Non traité",
    time: "08:50",
  },
];

let nextId = 26;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status) {
  if (status === "Nouveau") return "new";
  if (status === "En cours") return "progress";
  if (status === "Terminé") return "done";
  return "untreated";
}

function renderApp() {
  const total = requests.length;
  const nouveau = requests.filter((r) => r.status === "Nouveau").length;
  const encours = requests.filter((r) => r.status === "En cours").length;
  const termine = requests.filter((r) => r.status === "Terminé").length;
  const nontraite = requests.filter((r) => r.status === "Non traité").length;

  const list = requests
    .map(
      (r) => `
        <a class="request" href="/?id=${encodeURIComponent(r.id)}">
          <div class="request-top">
            <div class="avatar">${escapeHtml(r.name.charAt(0).toUpperCase())}</div>
            <div class="request-user">
              <strong>${escapeHtml(r.name)}</strong>
              <small>${escapeHtml(r.service)}</small>
            </div>
            <time>${escapeHtml(r.time)}</time>
          </div>

          <p>${escapeHtml(r.message)}</p>

          <span class="badge ${statusClass(r.status)}">
            ${escapeHtml(r.status)}
          </span>
        </a>
      `
    )
    .join("");

  const selectedId = requests.length
    ? new URLSearchParams(global.currentUrl || "").get("id") || requests[0].id
    : null;

  const selected =
    requests.find((r) => r.id === selectedId) || requests[0];

  let conversation = "";

  if (selected) {
    conversation = `
      <div class="conversation-header">
        <div class="avatar big">
          ${escapeHtml(selected.name.charAt(0).toUpperCase())}
        </div>

        <div>
          <h2>${escapeHtml(selected.name)}</h2>
          <small>Demande #${escapeHtml(selected.id)}</small>
        </div>

        <span class="badge ${statusClass(selected.status)} header-status">
          ${escapeHtml(selected.status)}
        </span>
      </div>

      <div class="messages">

        <div class="day">Aujourd'hui</div>

        <div class="message received">
          <p>${escapeHtml(selected.message)}</p>
          <span>${escapeHtml(selected.time)}</span>
        </div>

        <div class="message system-message">
          <strong>Suivi de la demande</strong>
          <p>
            Cette demande est actuellement suivie par le service informatique.
          </p>
        </div>

        <div class="intervention">
          <div>
            <small>INTERVENTION INFORMATIQUE</small>
            <h3>Changer le statut</h3>
          </div>

          <div class="status-buttons">
            <form method="POST" action="/status">
              <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
              <input type="hidden" name="status" value="Nouveau">
              <button class="${
                selected.status === "Nouveau" ? "active new" : ""
              }">Nouveau</button>
            </form>

            <form method="POST" action="/status">
              <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
              <input type="hidden" name="status" value="En cours">
              <button class="${
                selected.status === "En cours" ? "active progress" : ""
              }">En cours</button>
            </form>

            <form method="POST" action="/status">
              <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
              <input type="hidden" name="status" value="Terminé">
              <button class="${
                selected.status === "Terminé" ? "active done" : ""
              }">Terminé</button>
            </form>

            <form method="POST" action="/status">
              <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
              <input type="hidden" name="status" value="Non traité">
              <button class="${
                selected.status === "Non traité" ? "active untreated" : ""
              }">Non traité</button>
            </form>
          </div>
        </div>

        <form class="reply" method="POST" action="/message">
          <input type="hidden" name="id" value="${escapeHtml(selected.id)}">
          <input
            type="text"
            name="message"
            placeholder="Écrire une intervention..."
            required
          >
          <button type="submit">➤</button>
        </form>

      </div>
    `;

    const history = `
      <div class="detail-card">
        <small>DEMANDEUR</small>
        <strong>${escapeHtml(selected.name)}</strong>

        <small>SERVICE</small>
        <strong>${escapeHtml(selected.service)}</strong>

        <small>HEURE</small>
        <strong>${escapeHtml(selected.time)}</strong>

        <small>STATUT ACTUEL</small>
        <span class="badge ${statusClass(selected.status)}">
          ${escapeHtml(selected.status)}
        </span>

        <hr>

        <small>HISTORIQUE</small>

        <div class="timeline">
          <div>
            <b>Demande créée</b>
            <span>${escapeHtml(selected.time)}</span>
          </div>

          ${
            selected.status !== "Nouveau"
              ? `
                <div>
                  <b>Suivi informatique</b>
                  <span>Service Informatique</span>
                </div>
              `
              : ""
          }
        </div>
      </div>
    `;

    global.selectedHistory = history;
  }

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
  background: #eef3f7;
  color: #172b3a;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.layout {
  min-height: 100vh;
  display: flex;
}

.sidebar {
  width: 250px;
  background: #0f6ea8;
  color: white;
  padding: 24px 15px;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 10px 25px;
  border-bottom: 1px solid rgba(255,255,255,.15);
}

.logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: white;
  color: #0f6ea8;
  display: grid;
  place-items: center;
  font-weight: bold;
  font-size: 20px;
}

.logo h1 {
  margin: 0;
  font-size: 17px;
}

.logo small {
  color: #d8efff;
}

nav {
  margin-top: 20px;
}

nav a {
  display: block;
  color: white;
  text-decoration: none;
  padding: 13px 15px;
  margin-bottom: 5px;
  border-radius: 11px;
  font-size: 14px;
}

nav a:hover,
nav a.active {
  background: rgba(255,255,255,.15);
}

.logout {
  margin-top: auto;
  padding: 13px 15px;
}

.main {
  flex: 1;
  min-width: 0;
}

.topbar {
  height: 76px;
  background: white;
  border-bottom: 1px solid #e4eaf0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
}

.topbar h2 {
  margin: 0 0 4px;
}

.topbar p {
  margin: 0;
  color: #71808d;
  font-size: 13px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #e5f2fc;
  color: #0f6ea8;
  display: grid;
  place-items: center;
  font-weight: bold;
}

.stats {
  padding: 20px 25px;
  background: white;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  border-bottom: 1px solid #e4eaf0;
}

.stat {
  border: 1px solid #e7edf2;
  border-radius: 16px;
  padding: 15px;
  background: white;
  box-shadow: 0 3px 12px rgba(30,70,100,.05);
}

.stat-top {
  display: flex;
  justify-content: space-between;
  font-size: 24px;
}

.stat small {
  color: #73808b;
}

.workspace {
  display: grid;
  grid-template-columns: 310px 1fr 280px;
  min-height: calc(100vh - 176px);
}

.requests {
  background: white;
  border-right: 1px solid #e4eaf0;
  overflow-y: auto;
}

.requests-header {
  padding: 18px;
  border-bottom: 1px solid #e4eaf0;
}

.requests-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.requests-header h3 {
  margin: 0;
}

.count {
  background: #e9f4fc;
  color: #0f6ea8;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.new-request {
  display: block;
  text-align: center;
  text-decoration: none;
  background: #0f6ea8;
  color: white;
  padding: 12px;
  border-radius: 11px;
  margin-top: 14px;
  font-weight: bold;
  font-size: 13px;
}

.request {
  display: block;
  text-decoration: none;
  color: inherit;
  padding: 16px;
  border-bottom: 1px solid #edf1f4;
}

.request:hover {
  background: #f4f9fc;
}

.request-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #edf1f5;
  display: grid;
  place-items: center;
  font-weight: bold;
  color: #526575;
  flex-shrink: 0;
}

.avatar.big {
  width: 46px;
  height: 46px;
  background: #e5f2fc;
  color: #0f6ea8;
}

.request-user {
  flex: 1;
  min-width: 0;
}

.request-user strong,
.request-user small {
  display: block;
}

.request-user small {
  color: #7a8995;
  margin-top: 3px;
}

.request time {
  color: #9aa7b1;
  font-size: 11px;
}

.request p {
  color: #60717e;
  font-size: 13px;
  line-height: 1.5;
  margin: 11px 0;
}

.badge {
  display: inline-block;
  border: 1px solid;
  padding: 5px 9px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: bold;
}

.new {
  color: #b77900;
  background: #fff8e6;
  border-color: #f1d890;
}

.progress {
  color: #0871b4;
  background: #eaf6ff;
  border-color: #b7def5;
}

.done {
  color: #087d58;
  background: #e9faf4;
  border-color: #b8ead8;
}

.untreated {
  color: #c43d3d;
  background: #fff0f0;
  border-color: #f0baba;
}

.conversation {
  min-width: 0;
  background: #eef6fb;
  display: flex;
  flex-direction: column;
}

.conversation-header {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e4eaf0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.conversation-header h2 {
  margin: 0 0 4px;
  font-size: 17px;
}

.conversation-header small {
  color: #778692;
}

.header-status {
  margin-left: auto;
}

.messages {
  flex: 1;
  padding: 25px;
  overflow-y: auto;
}

.day {
  text-align: center;
  color: #8b9aa6;
  background: white;
  width: max-content;
  margin: 0 auto 20px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 11px;
}

.message {
  max-width: 75%;
  padding: 13px 15px;
  border-radius: 16px;
  margin-bottom: 15px;
  box-shadow: 0 3px 10px rgba(40,70,90,.05);
}

.received {
  background: white;
  border-top-left-radius: 5px;
}

.message p {
  margin: 0;
  line-height: 1.6;
  font-size: 13px;
}

.message span {
  display: block;
  text-align: right;
  margin-top: 7px;
  color: #9aa6af;
  font-size: 10px;
}

.system-message {
  background: #e7f4fd;
  border: 1px solid #c7e6f7;
  font-size: 13px;
}

.system-message p {
  margin-top: 7px;
  color: #536b7b;
}

.intervention {
  background: white;
  border: 1px solid #dcebf4;
  border-radius: 17px;
  padding: 17px;
  margin-top: 20px;
}

.intervention small,
.detail-card small {
  display: block;
  color: #8a98a2;
  font-weight: bold;
  font-size: 10px;
  letter-spacing: .5px;
}

.intervention h3 {
  margin: 6px 0 15px;
  font-size: 15px;
}

.status-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.status-buttons form {
  margin: 0;
}

.status-buttons button {
  width: 100%;
  border: 1px solid #dce3e8;
  background: white;
  color: #667681;
  border-radius: 10px;
  padding: 9px 5px;
  font-size: 11px;
}

.status-buttons button.active {
  font-weight: bold;
}

.status-buttons button.active.new {
  background: #fff8e6;
}

.status-buttons button.active.progress {
  background: #eaf6ff;
}

.status-buttons button.active.done {
  background: #e9faf4;
}

.status-buttons button.active.untreated {
  background: #fff0f0;
}

.reply {
  display: flex;
  gap: 8px;
  background: white;
  border-top: 1px solid #e2e8ed;
  padding: 13px;
}

.reply input {
  flex: 1;
  border: 1px solid #dce4e9;
  background: #f6f8fa;
  border-radius: 12px;
  padding: 11px 13px;
  outline: none;
}

.reply button {
  border: 0;
  background: #0f6ea8;
  color: white;
  border-radius: 12px;
  padding: 0 18px;
}

.details {
  background: white;
  border-left: 1px solid #e4eaf0;
}

.detail-title {
  padding: 20px;
  border-bottom: 1px solid #e4eaf0;
}

.detail-title h3 {
  margin: 7px 0 0;
}

.detail-card {
  padding: 20px;
}

.detail-card > strong,
.detail-card > .badge {
  display: block;
  margin: 6px 0 20px;
}

.detail-card hr {
  border: 0;
  border-top: 1px solid #edf0f2;
  margin: 5px 0 20px;
}

.timeline {
  margin-top: 15px;
  border-left: 2px solid #d9ebf7;
  padding-left: 14px;
}

.timeline div {
  margin-bottom: 15px;
}

.timeline b,
.timeline span {
  display: block;
}

.timeline span {
  color: #8a98a2;
  font-size: 11px;
  margin-top: 3px;
}

.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(10,30,45,.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 22px;
  padding: 25px;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
}

.close {
  border: 0;
  background: #f2f5f7;
  width: 35px;
  height: 35px;
  border-radius: 10px;
}

.form-group {
  margin-top: 17px;
}

.form-group label {
  display: block;
  margin-bottom: 7px;
  font-weight: bold;
  font-size: 13px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border: 1px solid #dce4e9;
  border-radius: 11px;
  padding: 12px;
  outline: none;
}

.form-group textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  flex: 1;
  padding: 12px;
  border-radius: 11px;
  border: 1px solid #dce4e9;
  background: white;
}

.form-actions .primary {
  background: #0f6ea8;
  color: white;
  border-color: #0f6ea8;
}

@media(max-width: 1100px) {
  .workspace {
    grid-template-columns: 280px 1fr;
  }

  .details {
    display: none;
  }
}

@media(max-width: 750px) {
  .sidebar {
    display: none;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
    padding: 12px;
  }

  .topbar {
    padding: 0 15px;
  }

  .workspace {
    display: block;
  }

  .requests {
    border-right: 0;
  }

  .conversation {
    min-height: 650px;
  }

  .status-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .messages {
    padding: 15px;
  }
}
</style>
</head>

<body>

<div class="layout">

<aside class="sidebar">

  <div class="logo">
    <div class="logo-icon">D</div>
    <div>
      <h1>DDI HELPDESK</h1>
      <small>Assistance Informatique</small>
    </div>
  </div>

  <nav>
    <a href="/" class="active">💬 Canal DDI</a>
    <a href="/?new=1">➕ Nouvelle demande</a>
    <a href="/">📋 Toutes les demandes</a>
    <a href="/">🔵 En cours</a>
    <a href="/">🟢 Terminées</a>
    <a href="/">🔴 Non traitées</a>
    <a href="/">🔔 Notifications</a>
    <a href="/">📊 Statistiques</a>
    <a href="/">👥 Utilisateurs</a>
  </nav>

  <div class="logout">🚪 Déconnexion</div>

</aside>

<main class="main">

<header class="topbar">

  <div>
    <h2>Canal DDI</h2>
    <p>Suivi des demandes d'assistance</p>
  </div>

  <div class="profile">
    <div class="profile-avatar">IT</div>
    <div>
      <strong>Service Informatique</strong>
      <small style="display:block;color:#7b8994">Administrateur</small>
    </div>
  </div>

</header>

<section class="stats">

  <div class="stat">
    <div class="stat-top">
      <span>🆕</span>
      <strong>${nouveau}</strong>
    </div>
    <small>Nouvelles</small>
  </div>

  <div class="stat">
    <div class="stat-top">
      <span>🔵</span>
      <strong>${encours}</strong>
    </div>
    <small>En cours</small>
  </div>

  <div class="stat">
    <div class="stat-top">
      <span>🟢</span>
      <strong>${termine}</strong>
    </div>
    <small>Terminées</small>
  </div>

  <div class="stat">
    <div class="stat-top">
      <span>🔴</span>
      <strong>${nontraite}</strong>
    </div>
    <small>Non traitées</small>
  </div>

</section>

<div class="workspace">

<section class="requests">

  <div class="requests-header">

    <div class="requests-header-row">
      <h3>Demandes</h3>
      <span class="count">${total}</span>
    </div>

    <a class="new-request" href="/?new=1">
      ➕ Nouvelle demande
    </a>

  </div>

  ${list}

</section>

<section class="conversation">

${conversation}

</section>

<aside class="details">

  <div class="detail-title">
    <small style="color:#8a98a2">DÉTAILS DE LA DEMANDE</small>
    ${
      selected
        ? `<h3>${escapeHtml(selected.id)}</h3>`
        : `<h3>Aucune demande</h3>`
    }
  </div>

  ${global.selectedHistory || ""}

</aside>

</div>

</main>

</div>

${
  global.showNew
    ? `
<div class="modal-bg">

  <div class="modal">

    <div class="modal-header">
      <div>
        <h2>Nouvelle demande</h2>
        <p style="color:#7a8995;font-size:13px">
          Enregistrer une demande d'assistance
        </p>
      </div>

      <a href="/" style="text-decoration:none">
        <button class="close">✕</button>
      </a>
    </div>

    <form method="POST" action="/new">

      <div class="form-group">
        <label>Nom du demandeur</label>
        <input
          name="name"
          placeholder="Ex : Mamadou Diallo"
          required
        >
      </div>

      <div class="form-group">
        <label>Service</label>

        <select name="service" required>
          <option value="">Sélectionner un service</option>
          <option>Direction</option>
          <option>Ressources Humaines</option>
          <option>Comptabilité</option>
          <option>Commercial</option>
          <option>Administration</option>
          <option>Informatique</option>
        </select>
      </div>

      <div class="form-group">
        <label>Problème rencontré</label>

        <textarea
          name="message"
          rows="5"
          placeholder="Décrivez le problème..."
          required
        ></textarea>
      </div>

      <div class="form-actions">
        <a
          href="/"
          style="flex:1;text-decoration:none"
        >
          <button type="button" style="width:100%">
            Annuler
          </button>
        </a>

        <button class="primary" type="submit">
          Créer la demande
        </button>
      </div>

    </form>

  </div>

</div>
`
    : ""
}

</body>
</html>
`;
}

app.use((req, res, next) => {
  global.currentUrl = req.url.split("?")[1] || "";
  global.showNew = new URLSearchParams(req.url.split("?")[1] || "").get("new") === "1";
  global.selectedHistory = "";
  next();
});

app.get("/", (req, res) => {
  res.send(renderApp());
});

app.post("/new", (req, res) => {
  const { name, service, message } = req.body;

  if (!name || !service || !message) {
    return res.redirect("/");
  }

  const now = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const request = {
    id: `DDI-${String(nextId).padStart(4, "0")}`,
    name,
    service,
    message,
    status: "Nouveau",
    time: now,
  };

  nextId++;
  requests.unshift(request);

  res.redirect(`/?id=${request.id}`);
});

app.post("/status", (req, res) => {
  const { id, status } = req.body;

  const allowed = [
    "Nouveau",
    "En cours",
    "Terminé",
    "Non traité",
  ];

  if (!allowed.includes(status)) {
    return res.redirect("/");
  }

  const request = requests.find((r) => r.id === id);

  if (request) {
    request.status = status;
  }

  res.redirect(`/?id=${encodeURIComponent(id)}`);
});

app.post("/message", (req, res) => {
  const { id } = req.body;

  res.redirect(`/?id=${encodeURIComponent(id)}`);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DDI HELPDESK lancé sur le port ${PORT}`);
});
