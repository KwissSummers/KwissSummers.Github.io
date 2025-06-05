// api/spotify-public.js - Upstash Redis version (simplest)

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let tracks = null;
        let timestamp = null;
        let source = 'none';

        // Try Upstash Redis first
        try {
            const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
            const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
            
            if (UPSTASH_URL && UPSTASH_TOKEN) {
                const response = await fetch(`${UPSTASH_URL}/get/spotify:tracks`, {
                    headers: {
                        'Authorization': `Bearer ${UPSTASH_TOKEN}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.result) {
                        const cachedData = JSON.parse(data.result);
                        tracks = cachedData.tracks;
                        timestamp = cachedData.timestamp;
                        source = 'upstash_redis';
                    }
                }
            }
        } catch (upstashError) {
            console.log('Upstash read failed, trying fallback');
        }

        // Fallback to memory cache
        if (!tracks && global.spotifyTracks && global.spotifyTracks.tracks) {
            tracks = global.spotifyTracks.tracks;
            timestamp = global.spotifyTracks.timestamp;
            source = 'memory_fallback';
        }

        if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
            return res.status(200).json({ 
                tracks: [],
                message: 'No tracks cached yet - admin needs to play music first',
                timestamp: null,
                source: 'none'
            });
        }

        // Return cached tracks
        const cacheAge = Date.now() - timestamp;
        
        return res.status(200).json({
            tracks: tracks,
            timestamp: timestamp,
            cached_ago_hours: Math.round(cacheAge / (1000 * 60 * 60)),
            message: `Loaded ${tracks.length} tracks from cache`,
            source: source
        });
        
    } catch (error) {
        console.error('Spotify public error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};