// spotify.js - Fixed Spotify Web API Integration with Deezer preview fallback

class SpotifyPlayer {
    constructor() {
        this.clientId = '8c6c27e0178f4ade956817d9ba7c8d69';
        // Set specific redirect URI based on current domain
        if (window.location.hostname === 'chrissummers.dev') {
            this.redirectUri = 'https://chrissummers.dev';
        } else if (window.location.hostname === 'kwisssummers.github.io') {
            this.redirectUri = 'https://kwisssummers.github.io';
        } else {
            // Fallback for local testing
            this.redirectUri = window.location.origin;
        }
        this.scopes = 'user-read-recently-played';
        this.accessToken = localStorage.getItem('spotify_access_token');
        this.refreshToken = localStorage.getItem('spotify_refresh_token');
        this.tokenExpiry = localStorage.getItem('spotify_token_expiry');
        this.currentAudio = null;
        this.updateInterval = null;
        this.tokenCheckInterval = null; // New: Regular token checking
    }

    // Initialize the Spotify player
    init() {
        console.log('Initializing Spotify Player...');

        // Check if we have a valid token
        if (this.accessToken && this.isTokenValid()) {
            console.log('Valid token found, starting updates');
            this.startUpdating();
            this.startTokenMonitoring(); // New: Monitor token expiry
        } else if (this.refreshToken && !this.isTokenValid()) {
            console.log('Token expired, attempting refresh');
            this.attemptTokenRefresh();
        } else if (this.hasAuthCode()) {
            console.log('Auth code found, handling callback');
            this.handleAuthCallback();
        } else {
            console.log('No valid auth, showing connect button');
            this.showConnectButton();
        }
    }

    // NEW: Monitor token expiry and refresh automatically
    startTokenMonitoring() {
        // Check token every 5 minutes
        this.tokenCheckInterval = setInterval(() => {
            console.log('Checking token validity...');
            if (!this.isTokenValid()) {
                console.log('Token expired, attempting refresh');
                this.attemptTokenRefresh();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    // NEW: Attempt to refresh token
    async attemptTokenRefresh() {
        if (!this.refreshToken) {
            console.log('No refresh token available, showing connect button');
            this.showConnectButton();
            return;
        }

        try {
            await this.refreshAccessToken();
            console.log('Token refreshed successfully');
            this.startUpdating();
        } catch (error) {
            console.error('Failed to refresh token:', error);
            // Clear invalid tokens and show connect button
            this.clearTokens();
            this.showConnectButton();
        }
    }

    // NEW: Clear all stored tokens
    clearTokens() {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        localStorage.removeItem('spotify_cached_tracks');
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
    }

    // Check if we have an auth code in the URL
    hasAuthCode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('code');
    }

    // IMPROVED: Check if current token is still valid (with buffer)
    isTokenValid() {
        if (!this.tokenExpiry || !this.accessToken) return false;
        // Add 5-minute buffer before expiry
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        return Date.now() < (parseInt(this.tokenExpiry) - bufferTime);
    }

    // Show connect to Spotify button
    showConnectButton() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        // Stop any running intervals
        this.stopUpdating();
        this.stopTokenMonitoring();

        container.innerHTML = `
            <div class="spotify-connect">
                <h3>🎵 Currently Playing</h3>
                <p>Connect your Spotify to see your recent tracks!</p>
                <button onclick="spotifyPlayer.authenticate()" class="spotify-btn">
                    Connect Spotify
                </button>
            </div>
        `;
    }

    // NEW: Stop token monitoring
    stopTokenMonitoring() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
    }

    // Start Spotify authentication
    authenticate() {
        const authUrl = new URL('https://accounts.spotify.com/authorize');
        const params = {
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            scope: this.scopes,
            show_dialog: 'true'
        };

        Object.keys(params).forEach(key => 
            authUrl.searchParams.append(key, params[key])
        );

        window.location.href = authUrl.toString();
    }

    // Handle the auth callback
    async handleAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            console.error('Spotify auth error:', error);
            this.showConnectButton();
            return;
        }

        if (code) {
            try {
                await this.getAccessToken(code);
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                this.startUpdating();
                this.startTokenMonitoring(); // Start monitoring after successful auth
            } catch (error) {
                console.error('Failed to get access token:', error);
                this.showConnectButton();
            }
        }
    }

    // Exchange auth code for access token
    async getAccessToken(code) {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: this.redirectUri,
                client_id: this.clientId,
                client_secret: '3247a84d5f754d9ab3464ff4848c41a8'
            })
        });

        if (!response.ok) throw new Error('Failed to get access token');

        const data = await response.json();

        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        // Store tokens
        localStorage.setItem('spotify_access_token', this.accessToken);
        localStorage.setItem('spotify_refresh_token', this.refreshToken);
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
    }

    // Get recently played tracks
    async getRecentTracks() {
        if (!this.accessToken) throw new Error('No access token');

        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=3', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                await this.attemptTokenRefresh();
                if (this.accessToken) return this.getRecentTracks();
                throw new Error('Failed to refresh token');
            }
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.items;
    }

    // Get 30-second preview from Deezer if Spotify doesn't have one
    async getDeezerPreview(trackName, artistName) {
        try {
            const query = encodeURIComponent(`${trackName} ${artistName}`);
            const res = await fetch(`https://api.deezer.com/search?q=${query}`);
            const data = await res.json();
            return data?.data?.[0]?.preview || null;
        } catch (err) {
            console.warn('Deezer preview fetch failed:', err);
            return null;
        }
    }

    // Render the UI with recent tracks and previews
    async renderTracks(tracks) {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        const tracksHtml = await Promise.all(tracks.map(async (item, index) => {
            const track = item.track;
            const artwork = track.album.images[0]?.url || '';
            let previewUrl = track.preview_url;

            if (!previewUrl) {
                previewUrl = await this.getDeezerPreview(track.name, track.artists[0].name);
            }

            const trackUrl = track.external_urls.spotify;

            return `
                <div class="track-item current-track">
                    <div class="track-artwork" onclick="window.open('${trackUrl}', '_blank')">
                        ${artwork ? `<img src="${artwork}" alt="${track.album.name}">` : '<div class="no-artwork">♪</div>'}
                    </div>
                    <div class="track-info">
                        <div class="track-title">${this.truncateText(track.name, 25)}</div>
                        <div class="track-artist">${this.truncateText(track.artists[0].name, 20)}</div>
                        ${previewUrl ? `
                        <div class="track-controls">
                            <button onclick="spotifyPlayer.togglePreview('${previewUrl}', this, '${index}')" class="play-btn" id="play-btn-${index}">▶</button>
                            <div class="progress-container">
                                <div class="progress-bar" id="progress-${index}"></div>
                            </div>
                            <span class="time-display" id="time-${index}">0:00</span>
                        </div>
                        ` : `
                        <div class="track-controls">
                            <span class="no-preview">Click artwork to listen on Spotify</span>
                        </div>
                        `}
                    </div>
                </div>
            `;
        }));

        container.innerHTML = `
            <div class="spotify-tracks">
                <h3>🎵 Recently Played</h3>
                ${tracksHtml.join('')}
            </div>
        `;
    }

    // Play and toggle 30-second preview audio
    togglePreview(previewUrl, button) {
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            document.querySelectorAll('.play-btn').forEach(btn => btn.textContent = '▶');
            if (this.currentAudio.src === previewUrl) {
                this.currentAudio = null;
                return;
            }
        }

        this.currentAudio = new Audio(previewUrl);
        this.currentAudio.volume = 0.5;
        this.currentAudio.play().then(() => {
            button.textContent = '⏸';
            this.currentAudio.onended = () => {
                button.textContent = '▶';
            };
        }).catch(error => {
            console.error('Failed to play preview:', error);
        });
    }

    // Utility: shorten text
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Update the widget every 60 seconds
    startUpdating() {
        this.updateDisplay();
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 60000);
    }

    // Stop periodic updates
    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Initialize Spotify player when DOM is loaded
let spotifyPlayer;
document.addEventListener('DOMContentLoaded', function() {
    spotifyPlayer = new SpotifyPlayer();
    spotifyPlayer.init();
});
