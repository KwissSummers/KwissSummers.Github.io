// spotify.js - Fixed timing issues and infinite loading

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
        
        console.log('🎵 Spotify Player initializing...', {
            hostname: window.location.hostname,
            apiBase: this.apiBase
        });
        
        this.scopes = 'user-read-recently-played';
        this.isOwner = false; // Will be set after admin check
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.currentAudio = null;
        this.updateInterval = null;
        this.tokenCheckInterval = null;
        this.maxRetries = 3;
        this.retryCount = 0;
    }

    // Check admin status with fallback
    checkIfOwner() {
        // First, check if admin protection is available
        if (typeof window.adminProtection !== 'undefined') {
            const isAdmin = window.adminProtection.isAdmin() && 
                           window.adminProtection.hasAdminFeature('spotify');
            
            if (isAdmin) {
                console.log('🔑 Spotify admin mode via protection system');
                localStorage.setItem('spotify_owner_mode', 'true');
                this.loadAdminTokens();
                return true;
            }
        }
        
        // Fallback: check old localStorage method
        const oldMethod = localStorage.getItem('spotify_owner_mode') === 'true';
        if (oldMethod) {
            console.log('🔑 Spotify admin mode via legacy storage');
            this.loadAdminTokens();
            return true;
        }
        
        // Clear admin tokens if not admin
        localStorage.removeItem('spotify_owner_mode');
        return false;
    }

    loadAdminTokens() {
        this.accessToken = localStorage.getItem('spotify_access_token');
        this.refreshToken = localStorage.getItem('spotify_refresh_token');
        this.tokenExpiry = localStorage.getItem('spotify_token_expiry');
    }

    init() {
        console.log('🎵 Initializing Spotify Player...');
        
        // Check admin status
        this.isOwner = this.checkIfOwner();
        
        if (this.isOwner) {
            console.log('🎵 Admin mode - checking authentication...');
            this.handleAdminMode();
        } else {
            console.log('🎵 Visitor mode - loading public tracks...');
            this.handleVisitorMode();
        }
    }

    handleAdminMode() {
        if (this.accessToken && this.isTokenValid()) {
            console.log('🎵 Valid admin token found');
            this.startUpdating();
            this.startTokenMonitoring();
        } else if (this.refreshToken && !this.isTokenValid()) {
            console.log('🎵 Admin token expired, refreshing...');
            this.attemptTokenRefresh();
        } else if (this.hasAuthCode()) {
            console.log('🎵 Processing admin auth callback...');
            this.handleAuthCallback();
        } else {
            console.log('🎵 Admin needs Spotify authentication');
            this.showOwnerAuthButton();
        }
    }

    handleVisitorMode() {
        // Show cached tracks immediately
        this.showCachedTracks();
        
        // Try to fetch fresh public data (with timeout)
        this.fetchPublicTracksWithTimeout();
    }

    async fetchPublicTracksWithTimeout() {
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        try {
            const fetchPromise = fetch(`${this.apiBase}/spotify-public`);
            const response = await Promise.race([fetchPromise, timeout]);
            
            if (response.ok) {
                const data = await response.json();
                if (data.tracks && data.tracks.length > 0) {
                    console.log('🎵 Loaded fresh public tracks');
                    await this.renderTracks(data.tracks, false);
                    return;
                }
            }
        } catch (error) {
            console.log('🎵 No public API available, using cached tracks');
        }
        
        // Ensure we show something
        this.ensureTracksDisplayed();
    }

    ensureTracksDisplayed() {
        const container = document.getElementById('spotify-widget');
        if (!container || container.innerHTML.includes('Loading')) {
            console.log('🎵 Ensuring tracks are displayed...');
            this.showCachedTracks();
        }
    }

    showOwnerAuthButton() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        container.innerHTML = `
            <div class="spotify-connect">
                <h3>🎵 Admin Setup</h3>
                <p>Connect your Spotify to share music with visitors!</p>
                <button onclick="spotifyPlayer.authenticate()" class="spotify-btn">
                    Setup Spotify
                </button>
            </div>
        `;
    }

    async fetchPublicTracks() {
        try {
            const response = await fetch(`${this.apiBase}/spotify-public`, {
                timeout: 5000
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.tracks && data.tracks.length > 0) {
                    console.log('🎵 Loaded public tracks');
                    await this.renderTracks(data.tracks, false);
                    return;
                }
            }
        } catch (error) {
            console.log('🎵 Public tracks unavailable:', error.message);
        }
        
        // Always fall back to cached
        this.showCachedTracks();
    }

    startTokenMonitoring() {
        if (!this.isOwner) return;
        
        this.tokenCheckInterval = setInterval(() => {
            if (!this.isTokenValid()) {
                console.log('🎵 Admin token expired, refreshing...');
                this.attemptTokenRefresh();
            }
        }, 5 * 60 * 1000);
    }

    async attemptTokenRefresh() {
        if (!this.isOwner || !this.refreshToken) {
            console.log('🎵 No refresh token for admin');
            this.showOwnerAuthButton();
            return;
        }

        try {
            await this.refreshAccessToken();
            console.log('🎵 Admin token refreshed');
            this.startUpdating();
        } catch (error) {
            console.error('🎵 Token refresh failed:', error);
            this.clearTokens();
            this.showOwnerAuthButton();
        }
    }

    clearTokens() {
        if (!this.isOwner) return;
        
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
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

    authenticate() {
        if (!this.isOwner) {
            console.log('🚨 Unauthorized Spotify auth attempt');
            alert('Admin access required for Spotify setup.');
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

        console.log('🎵 Redirecting admin to Spotify auth');
        window.location.href = authUrl.toString();
    }

    async handleAuthCallback() {
        if (!this.isOwner) {
            console.log('🚨 Unauthorized callback attempt');
            return;
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
            console.error('🎵 Spotify auth error:', error);
            this.showOwnerAuthButton();
            return;
        }

        if (code) {
            try {
                console.log('🎵 Processing admin callback...');
                await this.getAccessToken(code);
                window.history.replaceState({}, document.title, window.location.pathname);
                this.startUpdating();
                this.startTokenMonitoring();
            } catch (error) {
                console.error('🎵 Callback failed:', error);
                this.showOwnerAuthButton();
            }
        }
    }

    async getAccessToken(code) {
        if (!this.isOwner) return;
        
        console.log('🎵 Exchanging code for tokens...');
        
        const response = await fetch(`${this.apiBase}/spotify-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: code,
                redirect_uri: this.redirectUri
            })
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.status}`);
        }

        const data = await response.json();
        
        this.accessToken = data.access_token;
        this.refreshToken = data.refresh_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);

        localStorage.setItem('spotify_access_token', this.accessToken);
        localStorage.setItem('spotify_refresh_token', this.refreshToken);
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
        
        console.log('🎵 Admin tokens saved');
    }

    async refreshAccessToken() {
        if (!this.isOwner || !this.refreshToken) {
            throw new Error('No refresh token available');
        }

        console.log('🎵 Refreshing admin token...');

        const response = await fetch(`${this.apiBase}/spotify-refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refresh_token: this.refreshToken
            })
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status}`);
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
        
        console.log('🎵 Token refreshed');
    }

    async getRecentTracks() {
        if (!this.isOwner || !this.accessToken) {
            throw new Error('No admin access token');
        }

        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=3', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                await this.attemptTokenRefresh();
                if (this.accessToken) return this.getRecentTracks();
                throw new Error('Token refresh failed');
            }
            throw new Error(`Spotify API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('🎵 Retrieved', data.items.length, 'tracks');
        return data.items;
    }

    async updateDisplay() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        if (!this.isOwner) {
            this.fetchPublicTracks();
            return;
        }

        try {
            const tracks = await this.getRecentTracks();
            
            if (tracks && tracks.length > 0) {
                localStorage.setItem('spotify_cached_tracks', JSON.stringify(tracks));
                await this.renderTracks(tracks);
                this.cacheTracksPublicly(tracks);
            } else {
                this.showNoTracks();
            }
        } catch (error) {
            console.error('🎵 Update failed:', error);
            this.showCachedTracks();
        }
    }

    async cacheTracksPublicly(tracks) {
        try {
            await fetch(`${this.apiBase}/spotify-cache`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracks })
            });
            console.log('🎵 Tracks cached publicly');
        } catch (error) {
            console.log('🎵 Public caching unavailable');
        }
    }

    showCachedTracks() {
        const cachedTracks = localStorage.getItem('spotify_cached_tracks');
        if (cachedTracks) {
            try {
                const tracks = JSON.parse(cachedTracks);
                console.log('🎵 Showing cached tracks');
                this.renderTracks(tracks, true);
                return;
            } catch (error) {
                console.error('🎵 Cache parse error:', error);
            }
        }
        
        this.showNoTracks();
    }

    showNoTracks() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        const message = this.isOwner ? 
            'Play some music on Spotify to get started!' :
            'Music will appear here soon!';

        container.innerHTML = `
            <div class="spotify-tracks">
                <h3>🎵 Recently Played</h3>
                <div class="track-item">
                    <div class="track-artwork">
                        <div class="no-artwork">♪</div>
                    </div>
                    <div class="track-info">
                        <div class="track-title">No tracks yet</div>
                        <div class="track-artist">${message}</div>
                    </div>
                </div>
            </div>
        `;
    }

    async getAlternativePreview(trackName, artistName) {
        try {
            const query = encodeURIComponent(`${trackName} ${artistName}`);
            const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
                return data.results[0].previewUrl;
            }
        } catch (error) {
            console.warn('🎵 iTunes search failed:', error);
        }
        return null;
    }

    async renderTracks(tracks, isCached = false) {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        const statusText = this.isOwner ? 
            (isCached ? ' (Cached)' : '') : 
            " (Chris's Music)";

        try {
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
                                <span class="no-preview">Click artwork for Spotify</span>
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
        } catch (error) {
            console.error('🎵 Render error:', error);
            this.showNoTracks();
        }
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
            console.error('🎵 Preview failed:', error);
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
        if (!this.isOwner) return;
        
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
        
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
    }
}

// Initialize with proper timing
let spotifyPlayer;

function initializeSpotify() {
    if (spotifyPlayer) return; // Already initialized
    
    console.log('🎵 Creating Spotify Player...');
    spotifyPlayer = new SpotifyPlayer();
    
    // Small delay to ensure everything is ready
    setTimeout(() => {
        spotifyPlayer.init();
    }, 100);
}

// Multiple initialization triggers to ensure it loads
document.addEventListener('DOMContentLoaded', initializeSpotify);
window.addEventListener('load', initializeSpotify);

// Fallback initialization after a delay
setTimeout(initializeSpotify, 1000);