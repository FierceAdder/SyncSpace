const express = require('express');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const commentRoutes = require('./routes/commentRoutes');

const User = require('./models/User');
const Group = require('./models/Group');
const Resource = require('./models/Resources');

const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// CORS — allow Vite dev server in development
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? true  // same-origin in production (served as static files)
        : ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());

// ---- HTTP server + Socket.IO ----
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling'],
});

// Make io accessible to route handlers via req.app.get('io')
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    // Join a resource room (for live comments)
    socket.on('join_resource', (resourceId) => {
        socket.join(`resource:${resourceId}`);
    });

    // Leave a resource room
    socket.on('leave_resource', (resourceId) => {
        socket.leave(`resource:${resourceId}`);
    });

    // Typing indicators
    socket.on('typing', ({ resourceId, userName }) => {
        socket.to(`resource:${resourceId}`).emit('user_typing', { userName });
    });

    socket.on('stop_typing', ({ resourceId }) => {
        socket.to(`resource:${resourceId}`).emit('user_stop_typing');
    });
});

// ---- API Routes (all prefixed with /api) ----
app.use('/api/user', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/comments', commentRoutes);

// Public stats endpoint (no auth required)
app.get('/api/stats', async (req, res) => {
    try {
        const [users, groups, resources] = await Promise.all([
            User.countDocuments(),
            Group.countDocuments(),
            Resource.countDocuments()
        ]);
        res.json({ users, groups, resources });
    } catch (err) {
        res.status(500).json({ users: 0, groups: 0, resources: 0 });
    }
});

// Serve React static build in production
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, 'client', 'dist');
    app.use(express.static(clientBuildPath));
    // SPA fallback — Express v5 requires regex instead of '*' wildcard
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Use server.listen (not app.listen) so Socket.IO works
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
