// api/spotify-auto-update.js - Automatic background updates
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

        // Get token from cookie OR Authorization header
        let isAdmin = false;
        
        // Method 1: Check cookies (for browser requests)
        const cookies = req.headers.cookie;
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

        // Method 2: Check Authorization header (for automated calls)
        if (!isAdmin && req.headers.authorization) {
            try {
                const token = req.headers.authorization.replace('Bearer ', '');
                const decoded = jwt.verify(token, JWT_SECRET);
                isAdmin = decoded.admin === true;
            } catch (error) {
                isAdmin = false;
            }
        }

        // Only admin can trigger auto-updates
        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { access_token, refresh_token } = req.body;
        
        if (!access_token) {
            return res.status(400).json({ error: 'Access token required' });
        }

        // Get recent tracks from Spotify
        console.log('🤖 Auto-update: Fetching recent tracks...');
        
        const spotifyResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=3', {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });

        if (!spotifyResponse.ok) {
            if (spotifyResponse.status === 401 && refresh_token) {
                // Token expired, need to refresh
                return res.status(401).json({ 
                    error: 'Token expired',
                    needs_refresh: true 
                });
            }
            throw new Error(`Spotify API error: ${spotifyResponse.status}`);
        }

        const spotifyData = await spotifyResponse.json();
        const tracks = spotifyData.items;

        if (!tracks || tracks.length === 0) {
            return res.status(200).json({ 
                success: true,
                message: 'No recent tracks found',
                tracks_cached: 0
            });
        }

        // Cache tracks to Upstash Redis
        let cacheResult = 'memory';
        
        try {
            const UPSTASH_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
            const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
            
            if (UPSTASH_URL && UPSTASH_TOKEN) {
                const cacheData = {
                    tracks: tracks,
                    timestamp: Date.now(),
                    cached_by: 'auto_update'
                };
                
                // Store with 30 day expiration (2,592,000 seconds)
                const response = await fetch(`${UPSTASH_URL}/setex/spotify:tracks/2592000/${encodeURIComponent(JSON.stringify(cacheData))}`, {
                    headers: {
                        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    cacheResult = 'upstash_redis';
                    console.log(`🤖 Auto-cached ${tracks.length} tracks in Upstash Redis`);
                } else {
                    throw new Error('Upstash request failed');
                }
            } else {
                throw new Error('Upstash not configured');
            }
        } catch (upstashError) {
            console.log('🤖 Upstash unavailable, using memory fallback:', upstashError.message);
            
            // Fallback to memory cache
            if (!global.spotifyTracks) {
                global.spotifyTracks = {};
            }
            
            global.spotifyTracks = {
                tracks: tracks,
                timestamp: Date.now(),
                cached_by: 'auto_update'
            };
        }
        
        return res.status(200).json({ 
            success: true, 
            message: `Auto-cached ${tracks.length} tracks`,
            timestamp: Date.now(),
            storage: cacheResult,
            tracks_cached: tracks.length
        });
        
    } catch (error) {
        console.error('🤖 Auto-update error:', error);
        return res.status(500).json({ error: 'Auto-update failed' });
    }
};