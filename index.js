const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Canlı yayın karelerini ve verileri tutan geçici bellek
let activeStreams = {};

io.on('connection', (socket) => {
  // FiveM NUI'den gelen canlı ekran görüntüsü (Frame)
  socket.on('send-frame', (data) => {
    // data: { playerId: 1, frame: 'data:image/jpeg;base64,...' }
    activeStreams[data.playerId] = data.frame;
    io.emit('render-frame', data);
  });

  // Admin web paneline bağlandığında
  socket.on('request-players', () => {
    socket.emit('player-list', Object.keys(activeStreams));
  });
});

app.get('/', (req, res) => {
  res.send('Orion Anti-Cheat Signal Server Active!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));