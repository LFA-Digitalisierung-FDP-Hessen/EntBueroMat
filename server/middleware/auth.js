const jwt = require('jsonwebtoken');
const { query } = require('../database/db');

/**
 * Middleware to authenticate admin users using JWT
 */
async function authenticateAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access token required' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database to ensure they still exist and are active
        const userQuery = 'SELECT id, username, email, role FROM admin_users WHERE id = $1 AND is_active = true';
        const userResult = await query(userQuery, [decoded.userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Add user info to request object
        req.user = {
            id: userResult.rows[0].id,
            username: userResult.rows[0].username,
            email: userResult.rows[0].email,
            role: userResult.rows[0].role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        } else {
            console.error('Authentication error:', error);
            return res.status(500).json({ error: 'Authentication failed' });
        }
    }
}

/**
 * Middleware to require specific roles
 * @param {string[]} allowedRoles - Array of allowed roles
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role
            });
        }

        next();
    };
}

/**
 * Middleware to require admin role (convenience function)
 */
function requireAdmin(req, res, next) {
    return requireRole(['admin'])(req, res, next);
}

/**
 * Middleware to require moderator or admin role (convenience function)
 */
function requireModerator(req, res, next) {
    return requireRole(['admin', 'moderator'])(req, res, next);
}

/**
 * Middleware to optionally authenticate (doesn't fail if no token provided)
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No auth header, continue without user info
            return next();
        }

        const token = authHeader.substring(7);
        
        if (!token) {
            return next();
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const userQuery = 'SELECT id, username, email, role FROM admin_users WHERE id = $1 AND is_active = true';
        const userResult = await query(userQuery, [decoded.userId]);
        
        if (userResult.rows.length > 0) {
            req.user = {
                id: userResult.rows[0].id,
                username: userResult.rows[0].username,
                email: userResult.rows[0].email,
                role: userResult.rows[0].role
            };
        }

        next();
    } catch (error) {
        // On auth error with optional auth, just continue without user
        next();
    }
}

module.exports = {
    authenticateAdmin,
    requireRole,
    requireAdmin,
    requireModerator,
    optionalAuth
}; 