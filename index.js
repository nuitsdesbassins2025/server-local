const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public'))); // sert dashboard.html


server.listen(4000, () => {
  console.log('Local server UI running on http://localhost:4000');
});

const socketToRemote = require('socket.io-client')('https://nuit-des-bassins-client-9b7778c21473.herokuapp.com'); // Connexion au serveur central

socketToRemote.on('connect', () => {
  console.log('Connected to central server');
  socketToRemote.emit('register', 'server_local');
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/display.html'));
});


let lastUpdate = {};

socketToRemote.on('client_data', ({ id, data }) => {
  lastUpdate[id] = Date.now();
  io.emit('client_data', { id, data }); // envoie à la page graphique
});

// Envoie régulier des clients inactifs
setInterval(() => {
  const now = Date.now();
  const clients = Object.keys(lastUpdate);
  clients.forEach((id) => {
    const isActive = now - lastUpdate[id] < 5000;
    io.emit('client_status', { id, active: isActive });
  });
}, 1000);
