// api/spotify-cron-update.js - Autonomous Spotify updates via GitHub Actions

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
        // Get environment variables
        const CRON_SECRET = process.env.CRON_SECRET;
        const ADMIN_REFRESH_TOKEN = process.env.ADMIN_SPOTIFY_REFRESH_TOKEN;
        const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
        const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

        if (!CRON_SECRET || !ADMIN_REFRESH_TOKEN || !SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
            return res.status(500).json({ error: 'Server configuration incomplete' });
        }

        // Extract credentials from request body - with fallback for undefined body
        const body = req.body || {};
        const { source, secret } = body;

        // Debug logging
        console.log('Request method:', req.method);
        console.log('Content-Type:', req.headers['content-type']);
        console.log('Body received:', !!req.body);
        console.log('Secret received:', !!secret);

        // Check authentication with detailed debugging
        console.log('CRON_SECRET length:', CRON_SECRET?.length);
        console.log('Received secret length:', secret?.length);
        console.log('Secrets match:', secret === CRON_SECRET);
        
        if (!secret || secret !== CRON_SECRET) {
            return res.status(401).json({ 
                error: 'Unauthorized - missing credentials',
                debug: {
                    hasBody: !!req.body,
                    hasSecret: !!secret,
                    contentType: req.headers['content-type'],
                    secretLength: secret?.length,
                    cronSecretLength: CRON_SECRET?.length,
                    secretsMatch: secret === CRON_SECRET
                }
            });
        }

        console.log(`🤖 Autonomous update triggered by: ${source || 'unknown'}`);

        // Step 1: Refresh the admin's Spotify token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: ADMIN_REFRESH_TOKEN
            })
        });

        if (!tokenResponse.ok) {
            throw new Error(`Token refresh failed: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Step 2: Fetch recent tracks
        const tracksResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=3', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!tracksResponse.ok) {
            throw new Error(`Spotify API error: ${tracksResponse.status}`);
        }

        const tracksData = await tracksResponse.json();
        const tracks = tracksData.items;

        if (!tracks || tracks.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No recent tracks found',
                tracks_updated: 0
            });
        }

        // Step 3: Cache tracks using Upstash Redis or memory fallback
        let cacheResult = 'memory';
        
        try {
            const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
            const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
            
            if (UPSTASH_URL && UPSTASH_TOKEN) {
                const cacheData = {
                    tracks: tracks,
                    timestamp: Date.now(),
                    cached_by: 'autonomous_update',
                    source: source
                };
                
                // Store in Upstash with 24 hour expiration
                const cacheResponse = await fetch(`${UPSTASH_URL}/setex/spotify:tracks/86400/${encodeURIComponent(JSON.stringify(cacheData))}`, {
                    headers: {
                        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (cacheResponse.ok) {
                    cacheResult = 'upstash_redis';
                    console.log(`✅ Cached ${tracks.length} tracks in Upstash Redis autonomously`);
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
                cached_by: 'autonomous_update',
                source: source
            };
        }

        return res.status(200).json({
            success: true,
            message: `Autonomously updated ${tracks.length} tracks`,
            tracks_updated: tracks.length,
            storage: cacheResult,
            timestamp: Date.now(),
            source: source
        });

    } catch (error) {
        console.error('Autonomous Spotify update error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}