// spotify.js - Now uses secure admin protection

class SpotifyPlayer {
    constructor() {
        this.clientId = '8c6c27e0178f4ade956817d9ba7c8d69';
        
        // Smart routing for API calls
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.apiBase = 'http://localhost:3000/api';
            this.redirectUri = window.location.origin;
        } else if (window.location.hostname === 'chrissummers.dev') {
            this.apiBase = 'https://chrissummers.dev/api';
            this.redirectUri = 'https://chrissummers.dev';
        } else if (window.location.hostname === 'kwisssummers.github.io') {
            this.apiBase = 'https://kwiss-summers-github-io-wci4.vercel.app/api';
            this.redirectUri = 'https://kwisssummers.github.io';
        } else {
            this.apiBase = `${window.location.origin}/api`;
            this.redirectUri = window.location.origin;
        }
        
        console.log('Environment detected:', {
            hostname: window.location.hostname,
            apiBase: this.apiBase,
            redirectUri: this.redirectUri
        });
        
        this.scopes = 'user-read-recently-played';
        
        // SECURE: Use the admin protection system
        this.isOwner = this.checkIfOwner();
        
        if (this.isOwner) {
            // Owner mode: normal authentication
            this.accessToken = localStorage.getItem('spotify_access_token');
            this.refreshToken = localStorage.getItem('spotify_refresh_token');
            this.tokenExpiry = localStorage.getItem('spotify_token_expiry');
        } else {
            // Visitor mode: no authentication needed
            this.accessToken = null;
            this.refreshToken = null;
            this.tokenExpiry = null;
        }
        
        this.currentAudio = null;
        this.updateInterval = null;
        this.tokenCheckInterval = null;
    }

    // SECURE: Check admin status through protection system
    checkIfOwner() {
        // Wait for admin protection to be available
        if (typeof window.adminProtection === 'undefined') {
            console.log('⏳ Waiting for admin protection...');
            return false;
        }
        
        const isAdmin = window.adminProtection.isAdmin() && 
                       window.adminProtection.hasAdminFeature('spotify');
        
        if (isAdmin) {
            console.log('🔑 Spotify owner mode activated via admin protection');
            // Set the old localStorage for compatibility
            localStorage.setItem('spotify_owner_mode', 'true');
        } else {
            // Clear old localStorage if not admin
            localStorage.removeItem('spotify_owner_mode');
        }
        
        return isAdmin;
    }

    init() {
        console.log('Initializing Spotify Player...');
        
        // Re-check admin status in case it changed
        this.isOwner = this.checkIfOwner();
        
        if (this.isOwner) {
            // OWNER MODE: Handle authentication
            if (this.accessToken && this.isTokenValid()) {
                console.log('Valid owner token found, starting updates');
                this.startUpdating();
                this.startTokenMonitoring();
            } else if (this.refreshToken && !this.isTokenValid()) {
                console.log('Owner token expired, attempting refresh');
                this.attemptTokenRefresh();
            } else if (this.hasAuthCode()) {
                console.log('Owner auth code found, handling callback');
                this.handleAuthCallback();
            } else {
                console.log('Owner needs to authenticate');
                this.showOwnerAuthButton();
            }
        } else {
            // VISITOR MODE: Just try to load your cached music
            console.log('Visitor mode - loading cached tracks');
            this.showCachedTracks();
            
            // Try to fetch fresh data without authentication
            this.fetchPublicTracks();
        }
    }

    // Show admin authentication button only for authenticated admin
    showOwnerAuthButton() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        container.innerHTML = `
            <div class="spotify-connect">
                <h3>🎵 Owner Setup</h3>
                <p>Authenticate your Spotify to share your music with visitors!</p>
                <button onclick="spotifyPlayer.authenticate()" class="spotify-btn">
                    Setup Spotify (Admin)
                </button>
            </div>
        `;
    }

    // Try to fetch public/cached tracks for visitors
    async fetchPublicTracks() {
        try {
            // Try to fetch from your API endpoint that serves cached data
            const response = await fetch(`${this.apiBase}/spotify-public`);
            if (response.ok) {
                const data = await response.json();
                if (data.tracks && data.tracks.length > 0) {
                    console.log('Loaded public tracks for visitor');
                    await this.renderTracks(data.tracks, false);
                    return;
                }
            }
        } catch (error) {
            console.log('No public tracks available:', error);
        }
        
        // Fallback to any cached tracks in localStorage
        this.showCachedTracks();
    }

    startTokenMonitoring() {
        if (!this.isOwner) return; // Only monitor tokens for admin
        
        this.tokenCheckInterval = setInterval(() => {
            if (!this.isTokenValid()) {
                console.log('Owner token expired, attempting refresh');
                this.attemptTokenRefresh();
            }
        }, 5 * 60 * 1000);
    }

    async attemptTokenRefresh() {
        if (!this.isOwner || !this.refreshToken) {
            console.log('No refresh token available for admin');
            this.showOwnerAuthButton();
            return;
        }

        try {
            await this.refreshAccessToken();
            console.log('Admin token refreshed successfully');
            this.startUpdating();
        } catch (error) {
            console.error('Failed to refresh admin token:', error);
            this.clearTokens();
            this.showOwnerAuthButton();
        }
    }

    clearTokens() {
        if (!this.isOwner) return; // Only clear admin tokens
        
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        localStorage.removeItem('spotify_cached_tracks');
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
    }

    hasAuthCode() {
        return new URLSearchParams(window.location.search).has('code');
    }

    isTokenValid() {
        if (!this.tokenExpiry || !this.accessToken) return false;
        const bufferTime = 5 * 60 * 1000;
        return Date.now() < (parseInt(this.tokenExpiry) - bufferTime);
    }

    stopTokenMonitoring() {
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
    }

    authenticate() {
        if (!this.isOwner) {
            console.log('🚨 Unauthorized Spotify authentication attempt blocked');
            alert('Access denied. Admin authentication required.');
            return;
        }
        
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

        console.log('Redirecting authenticated admin to Spotify auth');
        window.location.href = authUrl.toString();
    }

    async handleAuthCallback() {
        if (!this.isOwner) {
            console.log('🚨 Unauthorized Spotify callback attempt blocked');
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            console.error('Spotify auth error:', error);
            this.showOwnerAuthButton();
            return;
        }

        if (code) {
            try {
                console.log('Handling admin auth callback');
                await this.getAccessToken(code);
                window.history.replaceState({}, document.title, window.location.pathname);
                this.startUpdating();
                this.startTokenMonitoring();
            } catch (error) {
                console.error('Failed to get access token:', error);
                this.showOwnerAuthButton();
            }
        }
    }

    async getAccessToken(code) {
        if (!this.isOwner) {
            console.log('🚨 Unauthorized token request blocked');
            return;
        }
        
        console.log('Exchanging admin code for token via API:', this.apiBase);
        
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
            console.error('Token exchange failed:', response.status, errorData);
            throw new Error(`Failed to get access token: ${response.status}`);
        }

        const data = await response.json();
        
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        localStorage.setItem('spotify_access_token', this.accessToken);
        localStorage.setItem('spotify_refresh_token', this.refreshToken);
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
        
        console.log('Admin tokens stored successfully');
    }

    async refreshAccessToken() {
        if (!this.isOwner || !this.refreshToken) throw new Error('No refresh token');

        console.log('Refreshing admin access token via API:', this.apiBase);

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
            const errorData = await response.text();
            console.error('Refresh failed:', response.status, errorData);
            throw new Error(`Failed to refresh token: ${response.status}`);
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
        
        console.log('Admin token refreshed successfully');
    }

    async getRecentTracks() {
        if (!this.isOwner || !this.accessToken) throw new Error('No access token for admin');

        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=3', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.log('Spotify API returned 401, attempting token refresh');
                await this.attemptTokenRefresh();
                if (this.accessToken) return this.getRecentTracks();
                throw new Error('Failed to refresh token');
            }
            throw new Error(`Spotify API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('Retrieved', data.items.length, 'recent tracks for admin');
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

        if (!this.isOwner) {
            // Visitors just see cached/public tracks
            this.fetchPublicTracks();
            return;
        }

        try {
            const tracks = await this.getRecentTracks();
            
            if (tracks && tracks.length > 0) {
                // Cache tracks for visitors
                localStorage.setItem('spotify_cached_tracks', JSON.stringify(tracks));
                await this.renderTracks(tracks);
                
                // OPTIONAL: Send to your API to cache publicly
                this.cacheTracksPublicly(tracks);
            } else {
                this.showNoTracks();
            }
        } catch (error) {
            console.error('Failed to update Spotify display:', error);
            this.showCachedTracks();
        }
    }

    // Cache tracks publicly for visitors
    async cacheTracksPublicly(tracks) {
        try {
            await fetch(`${this.apiBase}/spotify-cache`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracks })
            });
            console.log('Tracks cached publicly for visitors');
        } catch (error) {
            console.log('Could not cache tracks publicly:', error);
        }
    }

    showCachedTracks() {
        const cachedTracks = localStorage.getItem('spotify_cached_tracks');
        if (cachedTracks) {
            try {
                const tracks = JSON.parse(cachedTracks);
                console.log('Showing cached tracks to visitor');
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

        const message = this.isOwner ? 
            'No recent tracks found. Play some music on Spotify!' :
            'No music data available yet. Check back soon!';

        container.innerHTML = `
            <div class="spotify-tracks">
                <h3>🎵 Recently Played</h3>
                <div class="track-item">
                    <div class="track-artwork">
                        <div class="no-artwork">♪</div>
                    </div>
                    <div class="track-info">
                        <div class="track-title">No recent tracks</div>
                        <div class="track-artist">${message}</div>
                    </div>
                </div>
            </div>
        `;
    }

    async renderTracks(tracks, isCached = false) {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        const statusText = this.isOwner ? 
            (isCached ? ' (Cached)' : '') : 
            " (Chris's Music)";

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
                <h3>🎵 Recently Played${statusText}</h3>
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

    startUpdating() {
        if (!this.isOwner) return; // Only admin updates actively
        
        this.updateDisplay();
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 60000);
    }

    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Initialize when DOM is ready
let spotifyPlayer;
document.addEventListener('DOMContentLoaded', function() {
    // Wait for admin protection to be ready before initializing Spotify
    const initSpotify = () => {
        if (typeof window.adminProtection !== 'undefined') {
            spotifyPlayer = new SpotifyPlayer();
            spotifyPlayer.init();
        } else {
            // Wait a bit more for admin protection
            setTimeout(initSpotify, 100);
        }
    };
    
    initSpotify();
});