// api/spotify-refresh.js - Refresh Spotify access token
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            return res.status(400).json({ error: 'Missing refresh token' });
        }

        const clientId = '8c6c27e0178f4ade956817d9ba7c8d69';
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        
        if (!clientSecret) {
            console.error('Missing SPOTIFY_CLIENT_SECRET environment variable');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const tokenUrl = 'https://accounts.spotify.com/api/token';
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token,
            client_id: clientId,
            client_secret: clientSecret
        });

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json(data);
        } else {
            console.error('Spotify token refresh failed:', data);
            return res.status(response.status).json({ error: data.error || 'Token refresh failed' });
        }
        
    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}