// spotify.js - Frontend code that uses Vercel serverless functions

class SpotifyPlayer {
    constructor() {
        this.clientId = '8c6c27e0178f4ade956817d9ba7c8d69';
        
        // Set API base URL based on environment
        if (window.location.hostname === 'chrissummers.dev') {
            this.apiBase = 'https://chrissummers.dev/api';
            this.redirectUri = 'https://chrissummers.dev';
        } else if (window.location.hostname === 'kwisssummers.github.io') {
            // You'll need to update this to your Vercel deployment URL
            this.apiBase = 'https://your-vercel-app.vercel.app/api';
            this.redirectUri = 'https://kwisssummers.github.io';
        } else {
            // For local development
            this.apiBase = 'http://localhost:3000/api';
            this.redirectUri = window.location.origin;
        }
        
        this.scopes = 'user-read-recently-played';
        this.accessToken = localStorage.getItem('spotify_access_token');
        this.refreshToken = localStorage.getItem('spotify_refresh_token');
        this.tokenExpiry = localStorage.getItem('spotify_token_expiry');
        this.currentAudio = null;
        this.updateInterval = null;
        this.tokenCheckInterval = null;
    }

    // Initialize the Spotify Player
    init() {
        console.log('Initializing Spotify Player...');
        console.log('API Base:', this.apiBase);
        
        if (this.accessToken && this.isTokenValid()) {
            console.log('Valid token found, starting updates');
            this.startUpdating();
            this.startTokenMonitoring();
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

    // Start monitoring the token validity every 5 minutes
    startTokenMonitoring() {
        this.tokenCheckInterval = setInterval(() => {
            if (!this.isTokenValid()) {
                console.log('Token expired, attempting refresh');
                this.attemptTokenRefresh();
            }
        }, 5 * 60 * 1000);
    }

    // Attempt to refresh the access token using the stored refresh token
    async attemptTokenRefresh() {
        if (!this.refreshToken) {
            console.log('No refresh token available');
            this.showConnectButton();
            return;
        }

        try {
            await this.refreshAccessToken();
            console.log('Token refreshed successfully');
            this.startUpdating();
        } catch (error) {
            console.error('Failed to refresh token:', error);
            this.clearTokens();
            this.showConnectButton();
        }
    }

    // Clear all stored tokens and cached tracks
    clearTokens() {
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        localStorage.removeItem('spotify_cached_tracks');
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
    }

    // Check if the URL has an auth code
    hasAuthCode() {
        return new URLSearchParams(window.location.search).has('code');
    }

    // IMPROVED: Check if current token is still valid (with buffer)
    isTokenValid() {
        if (!this.tokenExpiry || !this.accessToken) return false;
        const bufferTime = 5 * 60 * 1000;
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

    // Stop monitoring the token validity
    stopTokenMonitoring() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
    }

    // Authenticate with Spotify
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

    // Handle the Spotify auth callback
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
                window.history.replaceState({}, document.title, window.location.pathname);
                this.startUpdating();
                this.startTokenMonitoring();
            } catch (error) {
                console.error('Failed to get access token:', error);
                this.showConnectButton();
            }
        }
    }

    // Use Vercel serverless function for token exchange
    async getAccessToken(code) {
        console.log('Exchanging code for token via Vercel API...');
        
        const response = await fetch(`${this.apiBase}/spotify-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                redirect_uri: this.redirectUri
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Token exchange failed:', errorData);
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
        
        console.log('Tokens stored successfully');
    }

    // Use Vercel serverless function for token refresh
    async refreshAccessToken() {
        if (!this.refreshToken) throw new Error('No refresh token');

        console.log('Refreshing access token via Vercel API...');

        const response = await fetch(`${this.apiBase}/spotify-refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: this.refreshToken
            })
        });

        if (!response.ok) {
            console.error('Refresh failed:', response.status);
            const errorData = await response.text();
            console.error('Error details:', errorData);
            throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        if (data.refresh_token) {
            this.refreshToken = data.refresh_token;
            localStorage.setItem('spotify_refresh_token', this.refreshToken);
        }

        localStorage.setItem('spotify_access_token', this.accessToken);
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
        
        console.log('Token refreshed successfully');
    }

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

    async getAlternativePreview(trackName, artistName) {
        try {
            const query = encodeURIComponent(`${trackName} ${artistName}`);
            const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
                console.log('Found iTunes preview for:', trackName);
                return data.results[0].previewUrl;
            }
        } catch (error) {
            console.warn('iTunes preview search failed:', error);
        }
        return null;
    }

    async updateDisplay() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        try {
            const tracks = await this.getRecentTracks();
            
            if (tracks && tracks.length > 0) {
                localStorage.setItem('spotify_cached_tracks', JSON.stringify(tracks));
                await this.renderTracks(tracks);
            } else {
                this.showNoTracks();
            }
        } catch (error) {
            console.error('Failed to update Spotify display:', error);
            this.showCachedTracks();
        }
    }

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

    async renderTracks(tracks, isCached = false) {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        const tracksHtml = await Promise.all(tracks.map(async (item, index) => {
            const track = item.track;
            const artwork = track.album.images[0]?.url || '';
            let previewUrl = track.preview_url;
            
            if (!previewUrl) {
                previewUrl = await this.getAlternativePreview(track.name, track.artists[0].name);
            }
            
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
                            <span class="no-preview">Click artwork to listen on Spotify</span>
                        </div>
                        `}
                    </div>
                </div>
            `;
        }));

        container.innerHTML = `
            <div class="spotify-tracks">
                <h3>🎵 Recently Played ${isCached ? '(Cached)' : ''}</h3>
                ${tracksHtml.join('')}
            </div>
        `;
    }

    togglePreview(previewUrl, button, trackIndex) {
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            document.querySelectorAll('.play-btn').forEach(btn => btn.textContent = '▶');
            
            if (this.currentAudio.src === previewUrl) {
                this.currentAudio = null;
                this.clearProgress(trackIndex);
                return;
            }
        }

        this.currentAudio = new Audio(previewUrl);
        this.currentAudio.volume = 0.5;
        
        this.currentAudio.play().then(() => {
            button.textContent = '⏸';
            this.trackProgress(trackIndex);
            
            this.currentAudio.onended = () => {
                button.textContent = '▶';
                this.clearProgress(trackIndex);
            };
        }).catch(error => {
            console.error('Failed to play preview:', error);
            button.textContent = '❌';
            setTimeout(() => button.textContent = '▶', 2000);
        });
    }

    trackProgress(trackIndex) {
        const progressBar = document.getElementById(`progress-${trackIndex}`);
        const timeDisplay = document.getElementById(`time-${trackIndex}`);
        
        if (!progressBar || !timeDisplay || !this.currentAudio) return;

        const updateProgress = () => {
            if (this.currentAudio && !this.currentAudio.paused) {
                const progress = (this.currentAudio.currentTime / this.currentAudio.duration) * 100;
                progressBar.style.width = progress + '%';
                
                const currentTime = Math.floor(this.currentAudio.currentTime);
                const minutes = Math.floor(currentTime / 60);
                const seconds = currentTime % 60;
                timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                requestAnimationFrame(updateProgress);
            }
        };
        
        updateProgress();
    }

    clearProgress(trackIndex) {
        const progressBar = document.getElementById(`progress-${trackIndex}`);
        const timeDisplay = document.getElementById(`time-${trackIndex}`);
        
        if (progressBar) progressBar.style.width = '0%';
        if (timeDisplay) timeDisplay.textContent = '0:00';
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Start updating the display every minute
    startUpdating() {
        this.updateDisplay();
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 60000);
    }

    // Stop updating the display
    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// spotify.js - Frontend code that uses Vercel serverless functions
let spotifyPlayer;
document.addEventListener('DOMContentLoaded', function() {
    spotifyPlayer = new SpotifyPlayer();
    spotifyPlayer.init();
});