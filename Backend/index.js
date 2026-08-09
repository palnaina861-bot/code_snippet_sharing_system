require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const userRouter = require('./routers/UserRouter');
const snippetRouter = require('./routers/SnippetRouter');
const folderRouter = require('./routers/FolderRouter');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// ─────────────────────────────────────────────
// Socket.IO — Live Updates
// ─────────────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Expose io instance to route handlers via app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client joins a snippet room to receive live edits
    socket.on('join:snippet', (snippetId) => {
        socket.join(`snippet:${snippetId}`);
        console.log(`[Socket.IO] ${socket.id} joined room snippet:${snippetId}`);
    });

    // Client leaves a snippet room
    socket.on('leave:snippet', (snippetId) => {
        socket.leave(`snippet:${snippetId}`);
        console.log(`[Socket.IO] ${socket.id} left room snippet:${snippetId}`);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
});

// ─────────────────────────────────────────────
// MongoDB Connection
// ─────────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
app.use('/api/user', userRouter);
app.use('/api/snippet', snippetRouter);
app.use('/api/folder', folderRouter);

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'SnippetHub API is running',
        version: '1.0.0',
        endpoints: {
            users: '/api/user',
            snippets: '/api/snippet',
            folders: '/api/folder'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.stack);
    res.status(500).json({ message: 'Internal server error.', error: err.message });
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
server.listen(port, () => {
    console.log(`[Server] SnippetHub API running on http://localhost:${port}`);
});