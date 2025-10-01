const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
// Environment variables are provided by docker-compose.yml or system environment
const http = require('http');

const { initializeDatabase } = require('./database/db');
const { setupDefaultAdmin } = require('./setup-admin');
const issuesRouter = require('./routes/issues');
const votesRouter = require('./routes/votes');
const adminRouter = require('./routes/admin');
const publicRouter = require('./routes/public');
const statusRouter = require('./routes/status');
const { setupWebSocket } = require('./routes/admin');

// Initialize scheduled tasks
require('./services/emailScheduler');

const app = express();

// Trust proxy for nginx reverse proxy
app.set('trust proxy', 1);

// Validate required environment variables
const requiredEnvVars = [
    { name: 'PORT', example: '3001', description: 'Server-Port' },
    { name: 'NEXT_PORT', example: '3000', description: 'Frontend-Port (Client)' },
    { name: 'BASE_URL', example: 'http://localhost:3000', description: 'Frontend-URL' },
    { name: 'NEXT_PUBLIC_API_URL', example: 'http://localhost:3001/api', description: 'API-URL' }
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar.name]);

if (missingVars.length > 0) {
    console.error('❌ FEHLER: Erforderliche Umgebungsvariablen fehlen:');
    missingVars.forEach(envVar => {
        console.error(`   ${envVar.name}=${envVar.example}  # ${envVar.description}`);
    });
    console.error('\n💡 Tipp: Kopiere .env.example zu .env und konfiguriere die Werte.');
    process.exit(1);
}

const PORT = process.env.PORT;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_URL?.replace('/api', ''), process.env.NEXT_PUBLIC_API_URL?.replace('/api', '').replace('http://', 'https://')],
            fontSrc: ["'self'", "fonts.gstatic.com", "use.typekit.net", "p.typekit.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "use.typekit.net", "p.typekit.net"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            objectSrc: ["'none'"],
            scriptSrcAttr: ["'none'"],
            upgradeInsecureRequests: []
        },
    },
}));

// Rate limiting - more lenient for general API usage
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3000, // increased by 200% (from 1000 to 3000) requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});

// Stricter rate limiting for submissions
const submitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // increased by 200% (from 10 to 30) submissions per hour
    message: 'Too many submissions from this IP, please try again later.'
});

// Very lenient rate limiting for vote status checks
const voteLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300, // increased by 200% (from 100 to 300) requests per minute for vote status
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
            process.env.BASE_URL,
            process.env.BASE_URL?.replace('http://', 'https://'),
            process.env.BASE_URL?.replace('localhost', '127.0.0.1'),
            process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') // Add server origin for debugging
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

// Welcome endpoint for root API access
app.get('/api', (req, res) => {
    res.status(200).json({
        message: '🎉 EntBüro-Mat API Server läuft!',
        version: '1.0.0',
        port: PORT,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        endpoints: {
            public: '/api/public',
            issues: '/api/issues', 
            votes: '/api/votes',
            admin: '/api/admin',
            status: '/api/status'
        },
        info: 'Dieser Server stellt die API für den EntBüro-Mat bereit.'
    });
});

// Apply general rate limiting to all API routes
app.use('/api', generalLimiter);

// API Routes with specific rate limiting
app.use('/api/votes', voteLimiter, votesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/public', publicRouter);
app.use('/api/status', statusRouter);

// Apply stricter rate limiting only to POST requests (new issue submissions)
app.use('/api/issues', (req, res, next) => {
    if (req.method === 'POST') {
        submitLimiter(req, res, next);
    } else {
        next();
    }
}, issuesRouter);

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
        
        const server = http.createServer(app);

        // Start the server
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
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