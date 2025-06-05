// spotify.js - QUICK FIX: Immediate loading, no waiting

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
        
        this.scopes = 'user-read-recently-played';
        this.currentAudio = null;
        this.updateInterval = null;
        this.tokenCheckInterval = null;
        
        console.log('🎵 Spotify Player created');
    }

    // SIMPLIFIED: Check admin status without waiting
    checkIfOwner() {
        // Method 1: Check admin protection if available
        if (window.adminProtection && window.adminProtection.isAdmin()) {
            console.log('🔑 Admin detected via protection system');
            return true;
        }
        
        // Method 2: Check localStorage (backup)
        if (localStorage.getItem('admin_authenticated') === 'true') {
            const timestamp = localStorage.getItem('admin_timestamp');
            if (timestamp && (Date.now() - parseInt(timestamp)) < 24 * 60 * 60 * 1000) {
                console.log('🔑 Admin detected via localStorage');
                return true;
            }
        }
        
        // Method 3: Check old Spotify flag
        if (localStorage.getItem('spotify_owner_mode') === 'true') {
            console.log('🔑 Admin detected via legacy flag');
            return true;
        }
        
        console.log('👥 Visitor mode detected');
        return false;
    }

    init() {
        console.log('🎵 Initializing Spotify Player...');
        
        // IMMEDIATE: Check admin status and proceed
        const isOwner = this.checkIfOwner();
        
        if (isOwner) {
            console.log('🎵 Admin mode - checking authentication');
            this.handleAdminMode();
        } else {
            console.log('🎵 Visitor mode - showing cached tracks');
            this.handleVisitorMode();
        }
    }

    handleAdminMode() {
        const accessToken = localStorage.getItem('spotify_access_token');
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        const tokenExpiry = localStorage.getItem('spotify_token_expiry');
        
        // Check if we have a valid token
        if (accessToken && this.isTokenValid(tokenExpiry)) {
            console.log('🎵 Valid token found - starting updates');
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.tokenExpiry = tokenExpiry;
            this.startUpdating();
            this.startTokenMonitoring();
        } else if (refreshToken) {
            console.log('🎵 Token expired - attempting refresh');
            this.refreshToken = refreshToken;
            this.attemptTokenRefresh();
        } else if (this.hasAuthCode()) {
            console.log('🎵 Processing auth callback');
            this.handleAuthCallback();
        } else {
            console.log('🎵 Need Spotify authentication');
            this.showOwnerAuthButton();
        }
    }

    handleVisitorMode() {
        // IMMEDIATE: Show cached tracks first
        this.showCachedTracksImmediate();
        
        // OPTIONAL: Try to fetch fresh data in background
        this.tryFetchPublicTracks();
    }

    showCachedTracksImmediate() {
        const cachedTracks = localStorage.getItem('spotify_cached_tracks');
        
        if (cachedTracks) {
            try {
                const tracks = JSON.parse(cachedTracks);
                if (tracks && tracks.length > 0) {
                    console.log('🎵 Displaying cached tracks immediately');
                    this.renderTracks(tracks, true);
                    return;
                }
            } catch (error) {
                console.error('🎵 Cache error:', error);
            }
        }
        
        // No cache available
        this.showNoTracks('visitor');
    }

    async tryFetchPublicTracks() {
        try {
            console.log('🎵 Trying to fetch fresh public tracks...');
            const response = await fetch(`${this.apiBase}/spotify-public`, {
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.tracks && data.tracks.length > 0) {
                    console.log('🎵 Fresh public tracks loaded');
                    this.renderTracks(data.tracks, false);
                }
            }
        } catch (error) {
            console.log('🎵 Public API unavailable:', error.message);
            // Keep showing cached tracks - don't change display
        }
    }

    isTokenValid(tokenExpiry) {
        if (!tokenExpiry) return false;
        const bufferTime = 5 * 60 * 1000; // 5 minutes
        return Date.now() < (parseInt(tokenExpiry) - bufferTime);
    }

    hasAuthCode() {
        return new URLSearchParams(window.location.search).has('code');
    }

    showOwnerAuthButton() {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        container.innerHTML = `
            <div class="spotify-connect">
                <h3>🎵 Admin Setup</h3>
                <p>Connect your Spotify to share music with visitors!</p>
                <button onclick="spotifyPlayer.authenticate()" class="spotify-btn">
                    Connect Spotify
                </button>
            </div>
        `;
    }

    showNoTracks(mode = 'visitor') {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        const message = mode === 'admin' ? 
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

    authenticate() {
        if (!this.checkIfOwner()) {
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

        console.log('🎵 Redirecting to Spotify auth');
        window.location.href = authUrl.toString();
    }

    async handleAuthCallback() {
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
                await this.getAccessToken(code);
                window.history.replaceState({}, document.title, window.location.pathname);
                this.startUpdating();
                this.startTokenMonitoring();
            } catch (error) {
                console.error('🎵 Auth callback failed:', error);
                this.showOwnerAuthButton();
            }
        }
    }

    async getAccessToken(code) {
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
        
        console.log('🎵 Tokens saved successfully');
    }

    async attemptTokenRefresh() {
        try {
            const response = await fetch(`${this.apiBase}/spotify-refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refresh_token: this.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error(`Refresh failed: ${response.status}`);
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
            
            console.log('🎵 Token refreshed successfully');
            this.startUpdating();
        } catch (error) {
            console.error('🎵 Token refresh failed:', error);
            this.showOwnerAuthButton();
        }
    }

    async getRecentTracks() {
        const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=3', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });

        if (!response.ok) {
            if (response.status === 401) {
                await this.attemptTokenRefresh();
                return this.getRecentTracks();
            }
            throw new Error(`Spotify API error: ${response.status}`);
        }

        const data = await response.json();
        return data.items;
    }

    async updateDisplay() {
        try {
            const tracks = await this.getRecentTracks();
            
            if (tracks && tracks.length > 0) {
                localStorage.setItem('spotify_cached_tracks', JSON.stringify(tracks));
                await this.renderTracks(tracks);
                this.cacheTracksPublicly(tracks);
            } else {
                this.showNoTracks('admin');
            }
        } catch (error) {
            console.error('🎵 Update failed:', error);
            this.showCachedTracksImmediate();
        }
    }

    async cacheTracksPublicly(tracks) {
        try {
            await fetch(`${this.apiBase}/spotify-cache`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracks })
            });
        } catch (error) {
            // Silently fail - not critical
        }
    }

    async renderTracks(tracks, isCached = false) {
        const container = document.getElementById('spotify-widget');
        if (!container) return;

        const isAdmin = this.checkIfOwner();
        const statusText = isAdmin ? 
            (isCached ? ' (Cached)' : '') : 
            " (Chris's Music)";

        try {
            const tracksHtml = await Promise.all(tracks.map(async (item, index) => {
                const track = item.track;
                const artwork = track.album.images[0]?.url || '';
                const previewUrl = track.preview_url || await this.getAlternativePreview(track.name, track.artists[0].name);
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

    async getAlternativePreview(trackName, artistName) {
        try {
            const query = encodeURIComponent(`${trackName} ${artistName}`);
            const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
                return data.results[0].previewUrl;
            }
        } catch (error) {
            // Silently fail
        }
        return null;
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
        this.updateDisplay();
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 60000);
    }

    startTokenMonitoring() {
        this.tokenCheckInterval = setInterval(() => {
            if (!this.isTokenValid(this.tokenExpiry)) {
                this.attemptTokenRefresh();
            }
        }, 5 * 60 * 1000);
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

// IMMEDIATE INITIALIZATION - No delays or waiting
let spotifyPlayer = new SpotifyPlayer();

// Initialize as soon as possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => spotifyPlayer.init());
} else {
    spotifyPlayer.init();
}