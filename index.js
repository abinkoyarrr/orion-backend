const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  // Direct Socket-to-Socket aktarımı (HTTP overhead yok)
  socket.on('upload-frame-socket', (data) => {
    io.emit('render-frame', {
      playerId: data.playerId,
      frame: data.frame
    });
  });
});

app.get('/', (req, res) => res.send('Orion Anti-Cheat Active!'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
