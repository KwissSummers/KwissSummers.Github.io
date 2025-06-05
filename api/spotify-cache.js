// api/spotify-cache.js - Upstash Redis version (simplest)
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify admin authentication
        const JWT_SECRET = process.env.JWT_SECRET;
        
        if (!JWT_SECRET) {
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Get token from cookie
        const cookies = req.headers.cookie;
        let isAdmin = false;
        
        if (cookies) {
            const tokenMatch = cookies.match(/admin-token=([^;]+)/);
            if (tokenMatch) {
                try {
                    const token = tokenMatch[1];
                    const decoded = jwt.verify(token, JWT_SECRET);
                    isAdmin = decoded.admin === true;
                } catch (error) {
                    isAdmin = false;
                }
            }
        }

        // Only admin can cache tracks
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { tracks } = req.body;
        
        if (!tracks || !Array.isArray(tracks)) {
            return res.status(400).json({ error: 'Invalid tracks data' });
        }

        // Try Upstash Redis first, fallback to memory
        let cacheResult = 'memory';
        
        try {
            // Use Upstash Redis REST API (no extra dependencies needed!)
            const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
            const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
            
            if (UPSTASH_URL && UPSTASH_TOKEN) {
                const cacheData = {
                    tracks: tracks,
                    timestamp: Date.now(),
                    cached_by: 'admin'
                };
                
                // Store in Upstash with 24 hour expiration
                const response = await fetch(`${UPSTASH_URL}/setex/spotify:tracks/86400/${encodeURIComponent(JSON.stringify(cacheData))}`, {
                    headers: {
                        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    cacheResult = 'upstash_redis';
                    console.log(`✅ Cached ${tracks.length} tracks in Upstash Redis`);
                } else {
                    throw new Error('Upstash request failed');
                }
            } else {
                throw new Error('Upstash not configured');
            }
        } catch (upstashError) {
            console.log('Upstash unavailable, using memory fallback:', upstashError.message);
            
            // Fallback to memory cache
            if (!global.spotifyTracks) {
                global.spotifyTracks = {};
            }
            
            global.spotifyTracks = {
                tracks: tracks,
                timestamp: Date.now(),
                cached_by: 'admin'
            };
        }
        
        return res.status(200).json({ 
            success: true, 
            message: `Cached ${tracks.length} tracks`,
            timestamp: Date.now(),
            storage: cacheResult
        });
        
    } catch (error) {
        console.error('Spotify cache error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};