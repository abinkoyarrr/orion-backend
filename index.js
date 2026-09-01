const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Busboy = require('busboy');

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

let activeStreams = {};

// screenshot-basic multipart/form-data isteğini karşılar
app.post('/upload-frame', (req, res) => {
  const playerId = req.query.playerId;

  if (!playerId) {
    return res.status(400).send('Missing playerId');
  }

  try {
    const busboy = Busboy({ headers: req.headers });
    let imageBuffer = [];

    busboy.on('file', (name, file, info) => {
      file.on('data', (data) => {
        imageBuffer.push(data);
      });

      file.on('end', () => {
        const buffer = Buffer.concat(imageBuffer);
        const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        
        activeStreams[playerId] = base64Image;

        // Web panele görüntüyü anlık gönder
        io.emit('render-frame', {
          playerId: playerId,
          frame: base64Image
        });
      });
    });

    busboy.on('finish', () => {
      res.status(200).send('OK');
    });

    req.pipe(busboy);
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).send('Server Error');
  }
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
