const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./database/db');
const { setupDefaultAdmin } = require('./setup-admin');
const issuesRouter = require('./routes/issues');
const votesRouter = require('./routes/votes');
const adminRouter = require('./routes/admin');
const publicRouter = require('./routes/public');
const statusRouter = require('./routes/status');

// Initialize scheduled tasks
require('./services/emailScheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting - more lenient for general API usage
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased from 100 to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Stricter rate limiting for submissions
const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // increased from 5 to 10 submissions per hour
    message: 'Too many submissions from this IP, please try again later.'
});

// Very lenient rate limiting for vote status checks
const voteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute for vote status
    message: 'Too many vote requests from this IP, please try again later.'
});

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:3000',
            'http://localhost:3001', // Add server origin for debugging
            process.env.BASE_URL
        ].filter(Boolean); // Remove undefined values
        
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// API Routes with specific rate limiting
app.use('/api/votes', voteLimiter, votesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);
app.use('/api/status', statusRouter);

// Apply stricter rate limiting to submissions (this goes after general to override)
app.use('/api/issues', submitLimiter, issuesRouter);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    if (error.type === 'entity.too.large') {
        return res.status(413).json({ error: 'File too large' });
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and start server
async function startServer() {
    try {
        await initializeDatabase();
        console.log('Database connected successfully');
        
        // Setup database with initial data
        const { setupDatabase } = require('./setup-db');
        await setupDatabase();
        
        // Setup default admin user
        await setupDefaultAdmin();
        
        app.listen(PORT, () => {
            console.log(`EntBüroMat server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
}); 