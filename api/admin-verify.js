// api/admin-verify.js - Check if user is authenticated
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get JWT secret from environment
        const JWT_SECRET = process.env.JWT_SECRET;
        
        if (!JWT_SECRET) {
            console.error('Missing JWT_SECRET environment variable');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Get token from cookie
        const cookies = req.headers.cookie;
        
        if (!cookies) {
            return res.status(200).json({ admin: false, reason: 'No cookies' });
        }

        // Parse admin token from cookies
        const tokenMatch = cookies.match(/admin-token=([^;]+)/);
        
        if (!tokenMatch) {
            return res.status(200).json({ admin: false, reason: 'No admin token' });
        }

        const token = tokenMatch[1];

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.admin === true) {
            return res.status(200).json({ 
                admin: true,
                timestamp: decoded.timestamp,
                expires: decoded.exp
            });
        } else {
            return res.status(200).json({ admin: false, reason: 'Invalid token data' });
        }
        
    } catch (error) {
        // Token invalid, expired, or malformed
        if (error.name === 'TokenExpiredError') {
            return res.status(200).json({ admin: false, reason: 'Token expired' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(200).json({ admin: false, reason: 'Invalid token' });
        } else {
            console.error('Token verification error:', error);
            return res.status(200).json({ admin: false, reason: 'Verification failed' });
        }
    }
}