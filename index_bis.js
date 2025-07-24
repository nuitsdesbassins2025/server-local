const express = require('express');
const path = require('path');
const http = require('http');
const { Server: ServerSocketIO } = require('socket.io');
const ioClient = require('socket.io-client');
const axios = require('axios');

const app = express();
const serverHttp = http.createServer(app);

// Serve les fichiers du dossier public
app.use(express.static(path.join(__dirname, 'public')));

// === SERVEUR SOCKET.IO LOCAL === //
const io_local = new ServerSocketIO(serverHttp);

// Quand une page (comme notifications.html) se connecte
io_local.on("connection", (socket) => {
  console.log("🟢 Client connecté au serveur local :", socket.id);

  // Quand la page envoie un message
  socket.on("send_message", (data) => {
    console.log("📩 Message reçu depuis notifications.html :", data);

    // Renvoyer aux autres clients connectés localement (broadcast)
    socket.broadcast.emit("send_message", data);

    // Optionnel : transmettre au serveur distant Heroku
    socket_heroku.emit("send_message", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client local déconnecté :", socket.id);
  });
});

// Démarrer le serveur HTTP + Socket.IO
serverHttp.listen(4000, () => {
  console.log('🚀 Serveur local en écoute sur http://localhost:4000');
});

// === CLIENT SOCKET.IO VERS HEROKU === //
const HEROKU_URL = "https://nuit-des-bassins-client-9b7778c21473.herokuapp.com";

// Connexion au serveur distant Heroku
const socket_heroku = ioClient(HEROKU_URL, {
  transports: ["websocket"]
});

socket_heroku.on("connect", () => {
  console.log("✅ Connecté au serveur Heroku");

  // Exemple : demander des données utilisateur
  socket_heroku.emit("get_user_data", { id: "user123" });

  // Écouter les réponses de Heroku
  socket_heroku.on("continuous_data", (data) => {
    console.log("📦 Données reçues de Heroku :", data);
  });

  socket_heroku.on("emit_message", (payload) => {
    console.log("📢 Message (emit_message) de Heroku :", payload);
    // Optionnel : retransmettre ce message localement
    io_local.emit("emit_message", payload);
  });

  socket_heroku.on("send_message", (payload) => {
    console.log("📢 Message (send_message) de Heroku :", payload);
    // Optionnel : retransmettre ce message localement
    io_local.emit("send_message", payload);
  });
});

socket_heroku.on("disconnect", () => {
  console.log("❌ Déconnecté de Heroku");
});

socket_heroku.on("connect_error", (err) => {
  console.error("❌ Erreur de connexion Heroku :", err.message);
});

// === ROUTES POUR LES PAGES HTML === //
app.get('/notif', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/notifications.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/display.html'));
});

// === OPTIONNEL : Requête HTTP pour récupérer des clients === //
const API_CLIENTS = HEROKU_URL + "/clients";

axios.get(API_CLIENTS)
  .then((res) => {
    console.log("✅ Clients récupérés via HTTP :", res.data);
  })
  .catch((err) => {
    console.error("❌ Erreur lors de la récupération des clients :", err.message);
  });
