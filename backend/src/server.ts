import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './sockets/socketManager.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

setupSocketHandlers(io);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

// ping server to prevent render sleep
const startKeepAlive = () => {
  const url = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;
  if (!url) return;

  const interval = 10 * 60 * 1000;
  setInterval(async () => {
    try {
      await fetch(`${url}/ping`);
    } catch {
      // ignore ping errors
    }
  }, interval);
};

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  startKeepAlive();
});
