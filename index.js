const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB Limit

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let activeStreams = {};

// screenshot-basic kütüphanesinden gelen ekran görüntülerini yakalar
app.post('/upload-frame', upload.single('files[]'), (req, res) => {
  const playerId = req.query.playerId;
  if (req.file && playerId) {
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    activeStreams[playerId] = base64Image;
    
    // Web panele canlı görüntüyü fırlat
    io.emit('render-frame', {
      playerId: playerId,
      frame: base64Image
    });
  }
  res.status(200).send('OK');
});

io.on('connection', (socket) => {
  socket.on('request-players', () => {
    socket.emit('player-list', Object.keys(activeStreams));
  });
});

app.get('/', (req, res) => {
  res.send('Orion Anti-Cheat Signal Server Active!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
