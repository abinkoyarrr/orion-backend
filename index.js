const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Raw image body kabul etmek için limit artırımı
app.use(express.raw({ type: 'image/*', limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let activeStreams = {};

// HTTP POST endpoint - Form veya raw upload kabul eder
app.post('/upload-frame', (req, res) => {
  const playerId = req.query.playerId;
  
  // Gelen veriyi base64 formatına çevir
  let base64Image = "";
  
  if (Buffer.isBuffer(req.body)) {
    base64Image = `data:image/jpeg;base64,${req.body.toString('base64')}`;
  } else if (req.body && req.body.data) {
    base64Image = req.body.data;
  }

  if (playerId && base64Image) {
    activeStreams[playerId] = base64Image;
    
    // Web panele görüntüyü yayınla
    io.emit('render-frame', {
      playerId: playerId,
      frame: base64Image
    });
    return res.status(200).send('OK');
  }

  res.status(400).send('Bad Request');
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
