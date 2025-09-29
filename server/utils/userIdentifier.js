const crypto = require('crypto');

// Create user identifier for anonymous voting
// Uses IP address and User-Agent to create a consistent identifier
function createUserIdentifier(req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    // Create a consistent hash
    const identifier = crypto.createHash('sha256').update(ip + userAgent).digest('hex');
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
        console.log('User identifier created:', {
            ip: ip,
            userAgent: userAgent.substring(0, 50) + '...',
            identifier: identifier.substring(0, 16) + '...'
        });
    }
    
    return identifier;
}

module.exports = { createUserIdentifier };
