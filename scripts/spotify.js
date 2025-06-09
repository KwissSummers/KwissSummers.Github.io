// spotify.js - Complete version with auto-updates and monthly cleanup

class SpotifyPlayer {
    constructor() {
        this.clientId = '8c6c27e0178f4ade956817d9ba7c8d69';
        
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
        this.autoUpdateInterval = null;
        this.tokenCheckInterval = null;
        
        console.log('🎵 Spotify Player constructed');
    }

    init() {
        console.log('🎵 =================================');
        console.log('🎵 SPOTIFY INITIALIZATION STARTING');
        console.log('🎵 =================================');
        
        const container = document.getElementById('spotify-widget');
        console.log('🎵 Container check:', container ? '✅ Found' : '❌ Missing');
        
        if (!container) {
            console.error('🎵 ❌ CRITICAL: spotify-widget container not found!');
            return;
        }

        console.log('🎵 Clearing loading state...');
        container.innerHTML = '<div class="spotify-loading"><h3>🎵 Initializing...</h3></div>';

        const isOwner = this.checkIfOwner();
        console.log('🎵 Admin status:', isOwner ? '🔑 ADMIN' : '👥 VISITOR');

        if (isOwner) {
            console.log('🎵 🔑 Entering ADMIN mode...');
            this.handleAdminMode();
        } else {
            console.log('🎵 👥 Entering VISITOR mode...');
            this.handleVisitorMode();
        }
    }

    checkIfOwner() {
        console.log('🎵 Checking admin status...');
        
        if (window.adminProtection) {
            console.log('🎵 Admin protection found:', window.adminProtection.isAdmin());
            if (window.adminProtection.isAdmin()) {
                console.log('🔑 Admin detected via protection system');
                return true;
            }
        }
        
        const adminAuth = localStorage.getItem('admin_authenticated');
        const adminTimestamp = localStorage.getItem('admin_timestamp');
        
        if (adminAuth === 'true' && adminTimestamp) {
            const sessionAge = Date.now() - parseInt(adminTimestamp);
            const sessionValid = sessionAge < 24 * 60 * 60 * 1000;
            
            if (sessionValid) {
                console.log('🔑 Admin detected via localStorage');
                return true;
            }
        }
        
        const legacyFlag = localStorage.getItem('spotify_owner_mode');
        if (legacyFlag === 'true') {
            console.log('🔑 Admin detected via legacy flag');
            return true;
        }
        
        console.log('👥 No admin access detected - visitor mode');
        return false;
    }

    handleAdminMode() {
        console.log('🔑 =================================');
        console.log('🔑 ADMIN MODE INITIALIZATION');
        console.log('🔑 =================================');
        
        const accessToken = localStorage.getItem('spotify_access_token');
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        const tokenExpiry = localStorage.getItem('spotify_token_expiry');
        
        console.log('🔑 Access token:', accessToken ? '✅ Present' : '❌ Missing');
        console.log('🔑 Refresh token:', refreshToken ? '✅ Present' : '❌ Missing');
        console.log('🔑 Token expiry:', tokenExpiry);
        
        if (accessToken && this.isTokenValid(tokenExpiry)) {
            console.log('🔑 ✅ Valid token found - starting admin updates');
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.tokenExpiry = tokenExpiry;
            this.startUpdating();
            this.startTokenMonitoring();
        } else if (refreshToken) {
            console.log('🔑 🔄 Token expired - attempting refresh');
            this.refreshToken = refreshToken;
            this.attemptTokenRefresh();
        } else if (this.hasAuthCode()) {
            console.log('🔑 📝 Processing auth callback');
            this.handleAuthCallback();
        } else {
            console.log('🔑 🎯 Need Spotify authentication');
            this.showOwnerAuthButton();
        }
    }

    handleVisitorMode() {
        console.log('👥 =================================');
        console.log('👥 VISITOR MODE INITIALIZATION');
        console.log('👥 =================================');
        
        console.log('👥 🚀 FORCE showing cached tracks...');
        this.forceShowCachedTracks();
        
        console.log('👥 🔄 Attempting to fetch fresh data in background...');
        this.tryFetchPublicTracks();
    }

    forceShowCachedTracks() {
        console.log('👥 🔍 Checking for cached tracks...');
        
        const cachedTracks = localStorage.getItem('spotify_cached_tracks');
        console.log('👥 Cached data:', cachedTracks ? '✅ Found' : '❌ None');
        
        if (cachedTracks) {
            try {
                const tracks = JSON.parse(cachedTracks);
                console.log('👥 Parsed tracks:', tracks.length);
                
                if (tracks && tracks.length > 0) {
                    console.log('👥 ✅ Rendering cached tracks immediately');
                    this.renderTracks(tracks, true);
                    return true;
                }
            } catch (error) {
                console.error('👥 ❌ Cache parse error:', error);
            }
        }
        
        console.log('👥 📭 No cached tracks - showing empty state');
        this.showNoTracks('visitor');
        return false;
    }

    async tryFetchPublicTracks() {
        try {
            console.log('👥 🌐 Fetching from:', `${this.apiBase}/spotify-public`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(`${this.apiBase}/spotify-public`, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('👥 API Response:', response.status, response.statusText);
            
            if (response.ok) {
                const data = await response.json();
                console.log('👥 API Data:', data);
                
                if (data.tracks && data.tracks.length > 0) {
                    console.log('👥 ✅ Fresh tracks loaded from API');
                    this.renderTracks(data.tracks, false);
                } else {
                    console.log('👥 📭 API returned no tracks');
                }
            } else {
                console.log('👥 ⚠️ API not available (expected)');
            }
        } catch (error) {
            console.log('👥 ⚠️ Public API unavailable:', error.name);
        }
    }

    isTokenValid(tokenExpiry) {
        if (!tokenExpiry) return false;
        const bufferTime = 5 * 60 * 1000;
        const valid = Date.now() < (parseInt(tokenExpiry) - bufferTime);
        console.log('🔑 Token valid:', valid);
        return valid;
    }

    hasAuthCode() {
        const hasCode = new URLSearchParams(window.location.search).has('code');
        console.log('🔑 Has auth code:', hasCode);
        return hasCode;
    }

    showOwnerAuthButton() {
        console.log('🔑 📱 Showing admin auth button');
        const container = document.getElementById('spotify-widget');
        if (!container) {
            console.error('🔑 ❌ Container missing for auth button!');
            return;
        }

        container.innerHTML = `
            <div class="spotify-connect">
                <h3>🎵 Admin Setup</h3>
                <p>Connect your Spotify to share music with visitors!</p>
                <button onclick="spotifyPlayer.authenticate()" class="spotify-btn">
                    Connect Spotify
                </button>
            </div>
        `;
        console.log('🔑 ✅ Auth button displayed');
    }

    showNoTracks(mode = 'visitor') {
        console.log(`${mode === 'admin' ? '🔑' : '👥'} 📭 Showing no tracks message`);
        const container = document.getElementById('spotify-widget');
        
        if (!container) {
            console.error(`${mode === 'admin' ? '🔑' : '👥'} ❌ Container missing for no tracks!`);
            return;
        }

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
        console.log(`${mode === 'admin' ? '🔑' : '👥'} ✅ No tracks message displayed`);
    }

    async renderTracks(tracks, isCached = false) {
        console.log(`🎵 🎨 Rendering ${tracks.length} tracks (cached: ${isCached})`);
        
        const container = document.getElementById('spotify-widget');
        if (!container) {
            console.error('🎵 ❌ Container missing for track rendering!');
            return;
        }

        const isAdmin = this.checkIfOwner();
        const statusText = isAdmin ? 
            (isCached ? ' (Cached)' : '') : 
            "";

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
            
            console.log('🎵 ✅ Tracks rendered successfully');
        } catch (error) {
            console.error('🎵 ❌ Render error:', error);
            this.showNoTracks();
        }
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
            console.log('🔑 📡 Fetching recent tracks from Spotify...');
            const tracks = await this.getRecentTracks();
            
            if (tracks && tracks.length > 0) {
                console.log(`🔑 ✅ Got ${tracks.length} tracks from Spotify`);
                
                // Cache locally first
                localStorage.setItem('spotify_cached_tracks', JSON.stringify(tracks));
                
                // Render tracks
                await this.renderTracks(tracks);
                
                // Cache tracks to server for visitors
                console.log('🔑 💾 Caching tracks to server...');
                await this.cacheTracksPublicly(tracks);
                console.log('🔑 ✅ Tracks cached to server successfully');
                
            } else {
                console.log('🔑 📭 No tracks found');
                this.showNoTracks('admin');
            }
        } catch (error) {
            console.error('🔑 ❌ Update failed:', error);
            this.forceShowCachedTracks();
        }
    }

    async cacheTracksPublicly(tracks) {
        try {
            console.log('🔑 🌐 Calling cache API with', tracks.length, 'tracks');
            
            const response = await fetch(`${this.apiBase}/spotify-cache`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ tracks })
            });
            
            console.log('🔑 📡 Cache API response:', response.status, response.statusText);
            
            if (response.ok) {
                const result = await response.json();
                console.log('🔑 ✅ Cache result:', result);
                return result;
            } else {
                const errorText = await response.text();
                console.error('🔑 ❌ Cache API error:', response.status, errorText);
                throw new Error(`Cache failed: ${response.status}`);
            }
        } catch (error) {
            console.error('🔑 ❌ Failed to cache tracks publicly:', error);
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

    // ENHANCED: Auto-update methods
    startUpdating() {
        // Immediate update
        this.updateDisplay();
        
        // Regular updates every 60 seconds (when admin is active)
        this.updateInterval = setInterval(() => {
            this.updateDisplay();
        }, 60000);
        
        // Background auto-updates every 2 hours (even when not actively browsing)
        this.autoUpdateInterval = setInterval(() => {
            this.triggerAutoUpdate();
        }, 2 * 60 * 60 * 1000); // 2 hours
        
        console.log('🤖 Auto-updates enabled: every 2 hours');
    }

    // NEW: Trigger background auto-update
    async triggerAutoUpdate() {
        if (!this.accessToken) {
            console.log('🤖 Auto-update skipped: no access token');
            return;
        }
        
        try {
            console.log('🤖 Triggering background auto-update...');
            
            const response = await fetch(`${this.apiBase}/spotify-auto-update`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('🤖 Auto-update success:', result.message);
            } else if (response.status === 401) {
                console.log('🤖 Auto-update token expired, refreshing...');
                await this.attemptTokenRefresh();
            } else {
                console.log('🤖 Auto-update failed:', response.status);
            }
        } catch (error) {
            console.log('🤖 Auto-update error:', error.message);
        }
    }

    startTokenMonitoring() {
        this.tokenCheckInterval = setInterval(() => {
            if (!this.isTokenValid(this.tokenExpiry)) {
                this.attemptTokenRefresh();
            }
        }, 5 * 60 * 1000);
    }

    // ENHANCED: Stop all updates including auto-updates
    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
        }
        
        if (this.tokenCheckInterval) {
            clearInterval(this.tokenCheckInterval);
            this.tokenCheckInterval = null;
        }
        
        console.log('🤖 All updates stopped');
    }
}

// FORCE INITIALIZE with detailed debugging
console.log('🎵 🚀 FORCE INITIALIZING SPOTIFY PLAYER...');

let spotifyPlayer;

function forceInitSpotify() {
    console.log('🎵 Force init called, readyState:', document.readyState);
    
    if (!spotifyPlayer) {
        console.log('🎵 Creating new Spotify player...');
        spotifyPlayer = new SpotifyPlayer();
    }
    
    console.log('🎵 Calling init...');
    spotifyPlayer.init();
}

// Multiple triggers to ensure it loads
if (document.readyState === 'loading') {
    console.log('🎵 Document still loading, adding listeners...');
    document.addEventListener('DOMContentLoaded', forceInitSpotify);
} else {
    console.log('🎵 Document ready, initializing immediately...');
    forceInitSpotify();
}

// Backup initialization
setTimeout(() => {
    console.log('🎵 Backup initialization trigger...');
    forceInitSpotify();
}, 500);

// Final fallback
setTimeout(() => {
    console.log('🎵 Final fallback initialization...');
    if (document.getElementById('spotify-widget') && 
        document.getElementById('spotify-widget').innerHTML.includes('Loading')) {
        console.log('🎵 Still loading detected, forcing init...');
        forceInitSpotify();
    }
}, 2000);