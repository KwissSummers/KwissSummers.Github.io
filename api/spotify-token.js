// api/spotify-token.js - Exchange authorization code for access token
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { code, redirect_uri } = req.body;
        
        if (!code || !redirect_uri) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const clientId = '8c6c27e0178f4ade956817d9ba7c8d69';
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET; // You'll need to add this env var
        
        if (!clientSecret) {
            console.error('Missing SPOTIFY_CLIENT_SECRET environment variable');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const tokenUrl = 'https://accounts.spotify.com/api/token';
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirect_uri,
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
            console.error('Spotify token exchange failed:', data);
            return res.status(response.status).json({ error: data.error || 'Token exchange failed' });
        }
        
    } catch (error) {
        console.error('Token exchange error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}