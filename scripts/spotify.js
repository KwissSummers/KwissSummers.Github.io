// spotify.js - Spotify Web API Integration

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
    }

    // Initialize the Spotify player
    init() {
        // Check if we have a valid token
        if (this.accessToken && this.isTokenValid()) {
            this.startUpdating();
        } else if (this.hasAuthCode()) {
            this.handleAuthCallback();
        } else {
            this.showConnectButton();
        }
    }

    // Check if we have an auth code in the URL
    hasAuthCode() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('code');
    }

    // Check if current token is still valid
    isTokenValid() {
        if (!this.tokenExpiry) return false;
        return Date.now() < parseInt(this.tokenExpiry);
    }

    // Show connect to Spotify button
    showConnectButton() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

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

        if (!response.ok) {
            throw new Error('Failed to get access token');
        }

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
        if (!this.accessToken) {
            throw new Error('No access token');
        }

        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=3', {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, try to refresh
                await this.refreshAccessToken();
                return this.getRecentTracks();
            }
            throw new Error('Failed to fetch recent tracks');
        }

        const data = await response.json();
        return data.items;
    }

    // Refresh access token
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token');
        }

        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.refreshToken,
                client_id: this.clientId,
                client_secret: '3247a84d5f754d9ab3464ff4848c41a8'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        localStorage.setItem('spotify_access_token', this.accessToken);
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
    }

    // Update the display with recent tracks
    async updateDisplay() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        try {
            const tracks = await this.getRecentTracks();
            
            if (tracks && tracks.length > 0) {
                // Cache the tracks
                localStorage.setItem('spotify_cached_tracks', JSON.stringify(tracks));
                this.renderTracks(tracks);
            } else {
                this.showNoTracks();
            }
        } catch (error) {
            console.error('Failed to update Spotify display:', error);
            this.showCachedTracks();
        }
    }

    // Show cached tracks if API fails
    showCachedTracks() {
        const cachedTracks = localStorage.getItem('spotify_cached_tracks');
        if (cachedTracks) {
            try {
                const tracks = JSON.parse(cachedTracks);
                this.renderTracks(tracks, true);
            } catch (error) {
                this.showNoTracks();
            }
        } else {
            this.showNoTracks();
        }
    }

    // Show no tracks message
    showNoTracks() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        container.innerHTML = `
            <div class="spotify-tracks">
                <h3>🎵 Recently Played</h3>
                <div class="track-item">
                    <div class="track-artwork">
                        <div class="no-artwork">♪</div>
                    </div>
                    <div class="track-info">
                        <div class="track-title">No recent tracks</div>
                        <div class="track-artist">Play some music on Spotify!</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render tracks in the UI
    renderTracks(tracks, isCached = false) {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        const tracksHtml = tracks.map((item, index) => {
            const track = item.track;
            const artwork = track.album.images[0]?.url || '';
            const previewUrl = track.preview_url;
            const trackUrl = track.external_urls.spotify;
            
            return `
                <div class="track-item current-track">
                    <div class="track-artwork" onclick="window.open('${trackUrl}', '_blank')" title="Open in Spotify">
                        ${artwork ? `<img src="${artwork}" alt="${track.album.name}">` : '<div class="no-artwork">♪</div>'}
                        <div class="spotify-overlay">🎵</div>
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
                            <span class="no-preview">Click icon to listen on Spotify!</span>
                        </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="spotify-tracks">
                <h3>🎵 Recently Played ${isCached ? '(Cached)' : ''}</h3>
                ${tracksHtml}
                <div class="spotify-footer">
                    <button onclick="spotifyPlayer.confirmDisconnect()" class="disconnect-btn" title="Disconnect your Spotify account">⚙️</button>
                </div>
            </div>
        `;
    }

    // Handle play button - either preview or open Spotify
    handlePlay(previewUrl, spotifyUrl, button) {
        // If it's a Spotify URL (no preview), open in new tab
        if (previewUrl === spotifyUrl) {
            window.open(spotifyUrl, '_blank');
            return;
        }
        
        // Otherwise, toggle preview playback
        this.togglePreview(previewUrl, button);
    }
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

    // Truncate text to fit display
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Start automatic updates
    startUpdating() {
        this.updateDisplay();
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 60000); // Update every minute
    }

    // Stop automatic updates
    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    // Confirm disconnect with prompt
    confirmDisconnect() {
        if (confirm('Are you sure you want to disconnect Spotify?')) {
            this.disconnect();
        }
    }

    // Disconnect Spotify
    disconnect() {
        this.stopUpdating();
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.showConnectButton();
    }
}

// Initialize Spotify player when DOM is loaded
let spotifyPlayer;
document.addEventListener('DOMContentLoaded', function() {
    spotifyPlayer = new SpotifyPlayer();
    spotifyPlayer.init();
});