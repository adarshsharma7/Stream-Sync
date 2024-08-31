const { createServer } = require('http');
const express = require('express');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const server = express();
const httpServer = createServer(server);
const io = new Server(httpServer, {
  cors: {
    origin: "https://youtube-clone-iota-ecru-26.vercel.app", // Ensure this URL is correct
    methods: ["GET", "POST"]
  }
});

// Initialize Socket.IO
io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });
});

// Handle all Next.js routes
server.all('*', (req, res) => {
  return handle(req, res);
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`> Ready on http://localhost:${PORT}`);
});

// Export io instance
module.exports = io;
