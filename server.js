const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const commentRoutes = require('./routes/commentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST"]
    }
});

// Make io accessible in routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a resource's chat room
    socket.on('join_resource', (resourceId) => {
        socket.join(`resource:${resourceId}`);
        console.log(`Socket ${socket.id} joined resource:${resourceId}`);
    });

    // Leave a resource's chat room
    socket.on('leave_resource', (resourceId) => {
        socket.leave(`resource:${resourceId}`);
        console.log(`Socket ${socket.id} left resource:${resourceId}`);
    });

    // Typing indicator
    socket.on('typing', ({ resourceId, userName }) => {
        socket.to(`resource:${resourceId}`).emit('user_typing', { userName });
    });

    socket.on('stop_typing', ({ resourceId }) => {
        socket.to(`resource:${resourceId}`).emit('user_stop_typing');
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ["http://localhost:5173", "http://localhost:5174"];
app.use(cors({ origin: allowedOrigins }));
const MONGO_URI = process.env.MONGO_URI;
app.use(express.json({ limit: '10mb' }));
app.use('/user', userRoutes);
app.use('/groups', groupRoutes);
app.use('/resources', resourceRoutes);
app.use('/comments', commentRoutes);
app.use('/feedback', feedbackRoutes);

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB via mongoose'))
    .catch(err => console.error("Encountered error while connecting to MongoDB : ", err));


app.get('/', (req, res) => {
    res.send("<h1>Welcome to SyncSpace</h1>");
});

// Public stats for landing page — no auth required
app.get('/stats', async (req, res) => {
    try {
        const User = require('./models/User');
        const Group = require('./models/Group');
        const Resource = require('./models/Resources');
        const [users, groups, resources] = await Promise.all([
            User.countDocuments(),
            Group.countDocuments(),
            Resource.countDocuments(),
        ]);
        res.json({ users, groups, resources });
    } catch (err) {
        res.json({ users: 0, groups: 0, resources: 0 });
    }
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client', 'dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
    });
}


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server live on port ${PORT} (with Socket.io)`);
});