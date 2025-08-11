const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const config = require('./config/config');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(config.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const app = express();

// CORS Configuration
app.use(cors({
    origin: ['https://pict-lost-and-found-frontend.onrender.com', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Static files - serve the public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Route Registration
app.use('/api/auth', require('./routes/auth')); // Authentication routes
app.use('/', require('./routes')); // Main API routes

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        status: 'API working',
        routes: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login'
            }
        }
    });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

//debugging code
// Add before app.listen()
console.log('Registered Routes:');
app._router.stack.forEach(middleware => {
    if (middleware.route) {
        console.log(`${Object.keys(middleware.route.methods)[0]} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
            if (handler.route) {
                console.log(`${Object.keys(handler.route.methods)[0]} /api${handler.route.path}`);
            }
        });
    }
}); //ends here

// Start Server
const PORT = config.PORT || 5000;
console.log(`Server is running on port ${PORT}`);
const server = app.listen(PORT, () => {
    console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
    console.log(`Server is accessible at http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    }
    throw error;
});

module.exports = app;