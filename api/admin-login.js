// api/admin-login.js - FIXED VERSION
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;

        // Get secrets from environment variables (NOT hardcoded!)
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
        const JWT_SECRET = process.env.JWT_SECRET;

        // Validate environment variables exist
        if (!ADMIN_PASSWORD || !JWT_SECRET) {
            console.error('Missing environment variables: ADMIN_PASSWORD or JWT_SECRET');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Validate input
        if (!password) {
            return res.status(400).json({ error: 'Password required' });
        }

        // Check password (from environment variable)
        if (password === ADMIN_PASSWORD) {
            // Create JWT token (expires in 24 hours)
            const token = jwt.sign(
                { 
                    admin: true, 
                    timestamp: Date.now() 
                }, 
                JWT_SECRET, 
                { expiresIn: '24h' }
            );

            // Set secure cookie
            res.setHeader('Set-Cookie', [
                `admin-token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${24 * 60 * 60}`
            ]);

            return res.status(200).json({ 
                success: true, 
                message: 'Authentication successful' 
            });
        } else {
            // Log failed attempt
            const clientIP = req.headers['x-forwarded-for'] || 
                           req.headers['x-real-ip'] || 
                           req.connection?.remoteAddress || 
                           'unknown';
            
            console.log(`Failed admin login attempt from ${clientIP} at ${new Date().toISOString()}`);
            
            return res.status(401).json({ 
                error: 'Invalid password' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}