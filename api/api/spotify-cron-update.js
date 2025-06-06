// api/spotify-cron-update.js - SECURED for GitHub Actions

module.exports = async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Security: Verify the request is from GitHub Actions
        const authHeader = req.headers.authorization;
        const expectedSecret = process.env.CRON_SECRET;
        
        if (!authHeader || !expectedSecret) {
            return res.status(401).json({ error: 'Unauthorized - missing credentials' });
        }
        
        const providedSecret = authHeader.replace('Bearer ', '');
        if (providedSecret !== expectedSecret) {
            return res.status(401).json({ error: 'Unauthorized - invalid secret' });
        }

        console.log('🤖 GITHUB ACTIONS: Starting autonomous Spotify update...');
        
        // Get stored admin credentials from environment variables
        const adminRefreshToken = process.env.ADMIN_SPOTIFY_REFRESH_TOKEN;
        const spotifyClientId = process.env.SPOTIFY_CLIENT_ID || '8c6c27e0178f4ade956817d9ba7c8d69';
        const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        
        if (!adminRefreshToken || !spotifyClientSecret) {
            console.error('🤖 GITHUB ACTIONS: Missing required environment variables');
            return res.status(500).json({ 
                error: 'Missing credentials',
                needed: ['ADMIN_SPOTIFY_REFRESH_TOKEN', 'SPOTIFY_CLIENT_SECRET']
            });
        }

        // Step 1: Refresh admin's Spotify token
        console.log('🤖 GITHUB ACTIONS: Refreshing Spotify access token...');
        
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: adminRefreshToken
            })
        });

        if (!tokenResponse.ok) {
            throw new Error(`Token refresh failed: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        
        console.log('🤖 GITHUB ACTIONS: ✅ Got fresh access token');

        // Step 2: Get recent tracks from Spotify
        console.log('🤖 GITHUB ACTIONS: Fetching recent tracks...');
        
        const tracksResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=3', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!tracksResponse.ok) {
            throw new Error(`Spotify API error: ${tracksResponse.status}`);
        }

        const tracksData = await tracksResponse.json();
        const tracks = tracksData.items;

        if (!tracks || tracks.length === 0) {
            console.log('🤖 GITHUB ACTIONS: No recent tracks found');
            return res.status(200).json({ 
                success: true,
                message: 'No recent tracks to cache',
                timestamp: Date.now()
            });
        }

        console.log(`🤖 GITHUB ACTIONS: Found ${tracks.length} recent tracks`);

        // Step 3: Cache tracks to Upstash Redis
        let cacheResult = 'failed';
        
        try {
            const UPSTASH_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
            const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
            
            if (UPSTASH_URL && UPSTASH_TOKEN) {
                const cacheData = {
                    tracks: tracks,
                    timestamp: Date.now(),
                    cached_by: 'github_actions_cron'
                };
                
                // Store with 30 day expiration (2,592,000 seconds)
                const cacheResponse = await fetch(`${UPSTASH_URL}/setex/spotify:tracks/2592000/${encodeURIComponent(JSON.stringify(cacheData))}`, {
                    headers: {
                        'Authorization': `Bearer ${UPSTASH_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (cacheResponse.ok) {
                    cacheResult = 'upstash_redis';
                    console.log(`🤖 GITHUB ACTIONS: ✅ Cached ${tracks.length} tracks in Upstash Redis`);
                } else {
                    throw new Error('Upstash request failed');
                }
            } else {
                throw new Error('Upstash not configured');
            }
        } catch (cacheError) {
            console.error('🤖 GITHUB ACTIONS: Cache failed:', cacheError.message);
            cacheResult = 'failed';
        }

        // Step 4: Update stored refresh token if provided
        if (tokenData.refresh_token) {
            // In a real deployment, you'd want to update the environment variable
            // For now, we'll just log it (you'd need to manually update it)
            console.log('🤖 GITHUB ACTIONS: New refresh token available (update environment variable)');
        }

        const result = {
            success: true,
            message: `Autonomously cached ${tracks.length} tracks`,
            timestamp: Date.now(),
            storage: cacheResult,
            tracks_updated: tracks.length,
            next_update: 'In 2 hours'
        };

        console.log('🤖 GITHUB ACTIONS: ✅ Autonomous update completed:', result);
        
        return res.status(200).json(result);
        
    } catch (error) {
        console.error('🤖 GITHUB ACTIONS: ❌ Autonomous update failed:', error);
        return res.status(500).json({ 
            error: 'Autonomous update failed',
            message: error.message,
            timestamp: Date.now()
        });
    }
};