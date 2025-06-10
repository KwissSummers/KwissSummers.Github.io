// 04-main-init.js - Enhanced Main Initialization - SYNTAX ERRORS FIXED

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing enhanced systems...');
    
    // ADDED: Initialize video background
    initVideoBackground();
    
    // Initialize enhanced hanging lights
    initEnhancedHangingLights();
    
    // Initialize persistent audio manager with enhanced features
    if (typeof PersistentAudioManager !== 'undefined') {
        window.persistentAudioManager = new EnhancedPersistentAudioManager();
    }
    
    // Initialize firefly effect using existing class from 02-audio-firefly.js
    if (typeof EnhancedFireflyEffect !== 'undefined') {
        window.enhancedFireflyEffect = new EnhancedFireflyEffect();
        window.enhancedFireflyEffect.init();
    }
    
    // Initialize page transitions
    if (typeof pageTransitions !== 'undefined') {
        pageTransitions.hideLoading();
        pageTransitions.initPageLoad();
    }
    
    // Initialize functionality
    initNavigationWithTransitions();
    initContactForm();
    initDevlogToggle();
    initBlogToggle();
    initBlogFiltering();
    initSmoothScroll();
    
    // Add enhanced control buttons
    addEnhancedControlButtons();
    
    // Initialize credits modal
    initCreditsModal();
    
    // Initialize accessibility features
    initAccessibilityFeatures();
    
    // Load recent devlogs on homepage
    if (document.getElementById('recent-devlogs')) {
        fetchRecentDevLogs();
    }
    
    // Performance optimization
    document.addEventListener('visibilitychange', () => {
        if (window.enhancedFireflyEffect) {
            if (document.hidden) {
                window.enhancedFireflyEffect.stop();
            } else {
                window.enhancedFireflyEffect.restart();
            }
        }
    });
    
    console.log('All enhanced systems initialized successfully');
});

// ADDED: Video background initialization
function initVideoBackground() {
    // Check if video background already exists
    if (document.querySelector('.video-background-framed')) {
        console.log('Video background already exists');
        return;
    }
    
    // Create video background container
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-background-framed';
    
    // Create video element
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    // Set correct video path
    video.src = 'videos/websiteBackground.mp4';
    
    // Error handling
    video.addEventListener('error', (e) => {
        console.log('Video failed to load:', video.src);
    });
    
    // Success logging
    video.addEventListener('loadeddata', () => {
        console.log('✅ Video background loaded successfully');
    });
    
    // Append video to container
    videoContainer.appendChild(video);
    
    // Insert at the beginning of body (behind everything)
    document.body.insertBefore(videoContainer, document.body.firstChild);
    
    console.log('📹 Video background container created');
}

// === ENHANCED HANGING LIGHTS SYSTEM ===
function initEnhancedHangingLights() {
    // Remove existing hanging elements
    const existingContainer = document.querySelector('.hanging-elements');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Add enhanced CSS first
    addEnhancedHangingLightsCSS();
    
    const hangingContainer = document.createElement('div');
    hangingContainer.className = 'hanging-elements';
    
    // Configuration for more varied and better distributed lights
    const lightConfig = {
        totalLights: 7,
        minDistance: 120,
        heightVariations: [
            { cordLength: 40, lightSize: 12 },
            { cordLength: 60, lightSize: 14 },
            { cordLength: 80, lightSize: 16 },
            { cordLength: 100, lightSize: 18 },
            { cordLength: 120, lightSize: 14 }
        ],
        colors: [
            'rgba(255, 215, 100, 0.95)',
            'rgba(255, 180, 80, 0.9)',
            'rgba(255, 200, 120, 0.85)',
            'rgba(255, 160, 60, 0.8)',
            'rgba(255, 235, 140, 0.9)'
        ]
    };
    
    const positions = [];
    const lights = [];
    
    // Generate better distributed positions with varied heights
    for (let i = 0; i < lightConfig.totalLights; i++) {
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 150) {
            const newPos = 8 + Math.random() * 84;
            
            const isFarEnough = positions.every(existingPos => {
                const distance = Math.abs(newPos - existingPos) * (window.innerWidth / 100);
                return distance >= lightConfig.minDistance;
            });
            
            if (isFarEnough) {
                positions.push(newPos);
                validPosition = true;
                
                const heightVariation = lightConfig.heightVariations[
                    Math.floor(Math.random() * lightConfig.heightVariations.length)
                ];
                
                const lightColor = lightConfig.colors[
                    Math.floor(Math.random() * lightConfig.colors.length)
                ];
                
                const element = document.createElement('div');
                element.className = 'hanging-element enhanced-light';
                
                const cord = document.createElement('div');
                cord.className = 'hanging-cord';
                cord.style.height = heightVariation.cordLength + 'px';
                
                const light = document.createElement('div');
                light.className = 'hanging-light';
                light.style.width = heightVariation.lightSize + 'px';
                light.style.height = heightVariation.lightSize + 'px';
                light.style.background = `radial-gradient(circle at 30% 30%, ${lightColor}, rgba(255, 180, 50, 0.4) 70%, transparent 100%)`;
                
                const glowIntensity = 8 + Math.random() * 8;
                light.style.boxShadow = `
                    0 0 ${glowIntensity}px ${lightColor},
                    0 0 ${glowIntensity * 2}px rgba(255, 180, 50, 0.4)
                `;
                
                element.appendChild(cord);
                element.appendChild(light);
                
                element.style.left = newPos + '%';
                element.style.top = '0px';
                
                element.style.animationDelay = Math.random() * 8 + 's';
                element.style.animationDuration = (5 + Math.random() * 6) + 's';
                
                hangingContainer.appendChild(element);
                lights.push({
                    element: element,
                    position: newPos,
                    height: heightVariation.cordLength,
                    size: heightVariation.lightSize,
                    color: lightColor
                });
            } else {
                attempts++;
            }
        }
    }
    
    document.body.appendChild(hangingContainer);
    
    console.log(`✨ Enhanced hanging lights initialized: ${lights.length} lights with varied heights and better spacing`);
    
    window.enhancedHangingLights = {
        lights: lights,
        container: hangingContainer,
        config: lightConfig,
        
        refresh: function() {
            hangingContainer.remove();
            initEnhancedHangingLights();
        },
        
        addMoreLights: function(count = 2) {
            lightConfig.totalLights += count;
            this.refresh();
        },
        
        reduceLights: function(count = 1) {
            lightConfig.totalLights = Math.max(3, lightConfig.totalLights - count);
            this.refresh();
        }
    };
}

// Enhanced CSS for the new hanging lights system
function addEnhancedHangingLightsCSS() {
    const existingStyle = document.getElementById('enhanced-hanging-lights-style');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'enhanced-hanging-lights-style';
    style.textContent = `
        /* Enhanced Hanging Lights Styles */
        .hanging-elements {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 250px;
            pointer-events: none;
            z-index: 10;
            overflow: visible;
        }
        
        .hanging-element.enhanced-light {
            position: absolute;
            transform-origin: top center;
            animation: enhancedHangingSwing ease-in-out infinite, lightPulse ease-in-out infinite alternate;
            filter: drop-shadow(0 0 8px rgba(255, 200, 100, 0.3));
        }
        
        .enhanced-light .hanging-cord {
            width: 2px;
            background: linear-gradient(
                to bottom, 
                rgba(200, 200, 210, 0.9) 0%, 
                rgba(180, 180, 190, 0.8) 25%, 
                rgba(160, 160, 170, 0.7) 50%, 
                rgba(140, 140, 150, 0.6) 75%, 
                rgba(120, 120, 130, 0.5) 100%
            );
            margin: 0 auto 5px auto;
            border-radius: 1px;
            box-shadow: 
                inset 1px 0 0 rgba(255, 255, 255, 0.3),
                inset -1px 0 0 rgba(0, 0, 0, 0.2);
        }
        
        .enhanced-light .hanging-light {
            border-radius: 50%;
            margin: 0 auto;
            border: 1px solid rgba(255, 200, 80, 0.3);
            transition: all 0.3s ease;
            position: relative;
        }
        
        /* Enhanced multi-layer glow animation */
        .enhanced-light .hanging-light::before {
            content: '';
            position: absolute;
            top: -6px;
            left: -6px;
            right: -6px;
            bottom: -6px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 215, 100, 0.3) 0%, rgba(255, 180, 80, 0.15) 50%, transparent 70%);
            animation: pulseGlow 4s ease-in-out infinite alternate;
        }
        
        .enhanced-light .hanging-light::after {
            content: '';
            position: absolute;
            top: -12px;
            left: -12px;
            right: -12px;
            bottom: -12px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(255, 200, 100, 0.1) 0%, transparent 60%);
            animation: outerGlow 6s ease-in-out infinite;
        }
        
        @keyframes enhancedHangingSwing {
            0%, 100% {
                transform: rotate(-1.5deg);
            }
            50% {
                transform: rotate(1.5deg);
            }
        }
        
        @keyframes lightPulse {
            0% {
                filter: brightness(1) drop-shadow(0 0 8px rgba(255, 200, 100, 0.3));
            }
            100% {
                filter: brightness(1.2) drop-shadow(0 0 15px rgba(255, 200, 100, 0.6));
            }
        }
        
        @keyframes pulseGlow {
            0% {
                opacity: 0.3;
                transform: scale(1);
            }
            100% {
                opacity: 0.8;
                transform: scale(1.2);
            }
        }
        
        @keyframes outerGlow {
            0%, 100% {
                opacity: 0.1;
                transform: scale(1);
            }
            50% {
                opacity: 0.4;
                transform: scale(1.5);
            }
        }
        
        /* Performance optimization */
        @media (prefers-reduced-motion: reduce) {
            .enhanced-light {
                animation: none !important;
            }
            
            .enhanced-light .hanging-light::before,
            .enhanced-light .hanging-light::after {
                animation: none !important;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// === ENHANCED PERSISTENT AUDIO MANAGER - WORKS WITH EXISTING CLASS ===
class EnhancedPersistentAudioManager extends PersistentAudioManager {
    constructor() {
        super();
        this.defaultVolume = 0.15; // Low default volume as specified
        this.volume = this.defaultVolume;
        this.userHasExplicitlyDisabled = false;
        this.hasEverPlayed = false;
        
        this.loadUserPreferences();
        this.loadVolumeForTabSwitching(); // ADDED: Load volume for tab switching
        this.initializeAudioVolume();
        this.setupConditionalAutoStart();
        this.setupTabSwitchingHandlers(); // ADDED: Setup tab switching handlers
        
        // ADDED: Initialize volume display immediately with saved volume
        setTimeout(() => {
            this.updateVolumeDisplay();
        }, 100);
    }
    
    initializeAudioVolume() {
        if (this.audio) {
            // FIXED: Set correct audio path
            this.audio.src = 'audio/ambient-loop.mp3';
            this.audio.volume = this.volume;
            console.log('🔊 Audio volume initialized to:', Math.round(this.volume * 100) + '%');
            console.log('🎵 Audio source set to: audio/ambient-loop.mp3');
        }
        
        if (window.globalAudioInstance && window.globalAudioInstance.audio) {
            window.globalAudioInstance.audio.volume = this.volume;
            window.globalAudioInstance.volume = this.volume;
        }
    }
    
    loadUserPreferences() {
        try {
            const settings = localStorage.getItem(this.storageKey);
            if (settings) {
                const parsed = JSON.parse(settings);
                // FIXED: Load saved volume properly, don't override with default
                this.volume = parsed.volume || this.defaultVolume;
                this.userHasExplicitlyDisabled = parsed.userExplicitlyDisabled === true;
                this.hasEverPlayed = parsed.hasEverPlayed === true;
                // FIXED: Enable music by default if user has interacted WEBSITE-WIDE and hasn't disabled
                this.isEnabled = this.hasEverPlayed && !this.userHasExplicitlyDisabled;
                console.log('🔊 Loaded saved volume:', Math.round(this.volume * 100) + '%');
                console.log('🎵 Music enabled:', this.isEnabled);
                console.log('🔄 Has ever played (website-wide):', this.hasEverPlayed);
            } else {
                this.isEnabled = false; // Start disabled until first interaction
                this.userHasExplicitlyDisabled = false;
                this.hasEverPlayed = false;
                this.volume = this.defaultVolume;
            }
        } catch (error) {
            console.warn('Failed to load audio preferences:', error);
            this.isEnabled = false;
            this.userHasExplicitlyDisabled = false;
            this.hasEverPlayed = false;
            this.volume = this.defaultVolume;
        }
    }
    
    saveSettings() {
        try {
            const settings = {
                audioEnabled: this.isEnabled,
                volume: this.volume,
                userExplicitlyDisabled: this.userHasExplicitlyDisabled,
                hasEverPlayed: this.hasEverPlayed
            };
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save audio settings:', e);
        }
    }
    
    setupConditionalAutoStart() {
        // FIXED: ALL auto-start attempts need interaction fallback due to browser autoplay policies
        // - First-time visitors: Setup interaction listener + immediate attempt  
        // - Returning users with music enabled: Setup interaction listener + immediate attempt
        // - Users who disabled music: Stay off
        
        if (!this.userHasExplicitlyDisabled) {
            // Anyone who should have music enabled - try both approaches
            this.attemptImmediateStart();
            this.setupAutoStartOnInteraction();
            
            if (!this.hasEverPlayed) {
                console.log('🎵 First-time visitor: Attempting immediate start + interaction fallback');
            } else {
                console.log('🎵 Returning user: Attempting immediate start + interaction fallback');
            }
        } else {
            console.log('🔇 Music stays off - user has explicitly disabled audio');
            this.updateButtons();
        }
    }
    
    // ADDED: Immediate start attempt (inspired by older version)
    attemptImmediateStart() {
        const startAudio = () => {
            // Double-check preferences haven't changed
            if (this.userHasExplicitlyDisabled) {
                console.log('🔇 Immediate start cancelled - user disabled audio');
                return;
            }
            
            console.log('🎵 Attempting immediate audio start...');
            this.startAudio();
            this.hasEverPlayed = true;
            this.saveSettings();
        };
        
        // Try immediate start with small delay (like older version)
        setTimeout(startAudio, 100);
    }
    
    setupAutoStartOnInteraction() {
        const startAudioOnInteraction = (e) => {
            console.log('🎵 ANY interaction detected (including clicks on empty space):', e.type);
            
            if (!this.userHasExplicitlyDisabled) {
                // Only start if not already playing (avoid double-start)
                if (!this.audio || this.audio.paused) {
                    // Ensure audio is properly initialized
                    if (!this.audio || !this.audio.src) {
                        this.initializeAudioVolume();
                    }
                    
                    this.startAudio();
                    this.isEnabled = true;
                    this.saveSettings();
                    
                    if (!this.hasEverPlayed) {
                        this.hasEverPlayed = true;
                        console.log('🎵 Music enabled for FIRST-TIME user via interaction - will persist between pages');
                    } else {
                        console.log('🎵 Music resumed for RETURNING user via interaction - continues between pages');
                    }
                } else {
                    console.log('🎵 Audio already playing from immediate start');
                }
            }
            
            // Remove listeners after first interaction
            document.removeEventListener('click', startAudioOnInteraction, true);
            document.removeEventListener('keydown', startAudioOnInteraction, true);
            document.removeEventListener('touchstart', startAudioOnInteraction, true);
            document.removeEventListener('mousedown', startAudioOnInteraction, true);
        };
        
        // Listen to ALL possible interactions (including clicks on empty space)
        document.addEventListener('click', startAudioOnInteraction, { once: true, capture: true });
        document.addEventListener('keydown', startAudioOnInteraction, { once: true, capture: true });
        document.addEventListener('touchstart', startAudioOnInteraction, { once: true, capture: true });
        document.addEventListener('mousedown', startAudioOnInteraction, { once: true, capture: true });
        
        console.log('🎵 Interaction listeners set up - will trigger on ANY click (including empty space)');
    }
    
    async startAudio() {
        if (!this.audio) return;
        
        try {
            // Ensure audio source is set
            if (!this.audio.src) {
                this.audio.src = 'audio/ambient-loop.mp3';
            }
            
            this.audio.volume = this.volume;
            if (window.globalAudioInstance && window.globalAudioInstance.audio) {
                window.globalAudioInstance.audio.volume = this.volume;
            }
            
            if (!this.audio.paused) {
                this.isEnabled = true;
                this.hasEverPlayed = true;
                this.saveSettings();
                this.updateButtons();
                this.updateVolumeDisplay();
                console.log('🎵 Audio already playing');
                return;
            }

            console.log('🎵 Attempting to start audio...');
            await this.audio.play();
            this.isEnabled = true;
            this.userHasExplicitlyDisabled = false;
            this.hasEverPlayed = true;
            window.globalAudioInstance.isPlaying = true;
            this.saveSettings();
            this.saveAudioState();
            this.updateButtons();
            this.updateVolumeDisplay();
            console.log('🎵 Audio started successfully at volume:', Math.round(this.volume * 100) + '%');
        } catch (error) {
            console.warn('🚫 Audio play failed (this is normal on page load):', error.message);
            // Still mark as enabled so it will work on next page or interaction
            this.isEnabled = true;
            this.updateButtons();
            this.updateVolumeDisplay();
            
            // Retry on next user interaction if this was the first attempt
            if (!this.hasEverPlayed) {
                console.log('🔄 Will retry on next user interaction');
            }
        }
    }
    
    stopAudio() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.isEnabled = false;
        this.userHasExplicitlyDisabled = true;
        window.globalAudioInstance.isPlaying = false;
        this.saveSettings();
        this.saveAudioState();
        this.updateButtons();
        this.updateVolumeDisplay();
    }
    
    // FIXED: Setup handlers for tab switching to maintain audio playback
    setupTabSwitchingHandlers() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Tab became inactive - save state but keep music playing if enabled
                this.saveVolumeForTabSwitching();
                console.log('🔄 Tab hidden - saving state, music continues if enabled');
            } else {
                // Tab became active - restore volume and resume if needed
                this.loadVolumeForTabSwitching();
                if (this.isEnabled && !this.userHasExplicitlyDisabled && this.hasEverPlayed) {
                    // Resume music if it should be playing
                    if (this.audio && this.audio.paused) {
                        this.audio.play().catch(console.warn);
                    }
                }
                console.log('🔄 Tab visible - restored state, resumed music if needed');
            }
        });
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.saveVolumeForTabSwitching();
        });
        
        // Restore on focus - ensure music continues
        window.addEventListener('focus', () => {
            this.loadVolumeForTabSwitching();
            if (this.isEnabled && !this.userHasExplicitlyDisabled && this.hasEverPlayed) {
                if (this.audio && this.audio.paused) {
                    this.audio.play().catch(console.warn);
                }
            }
        });
    }
    
    toggle() {
        if (this.isEnabled) {
            this.stopAudio();
        } else {
            this.startAudio();
        }
    }
    
    setVolume(newVolume) {
        this.volume = Math.max(0, Math.min(1, newVolume));
        
        if (this.audio) {
            this.audio.volume = this.volume;
        }
        if (window.globalAudioInstance && window.globalAudioInstance.audio) {
            window.globalAudioInstance.audio.volume = this.volume;
            window.globalAudioInstance.volume = this.volume;
        }
        
        this.saveSettings();
        this.saveAudioState();
        this.updateVolumeDisplay();
        
        // FIXED: Save volume but DON'T stop/restart music
        this.saveVolumeForTabSwitching();
        console.log('🔊 Volume changed to:', Math.round(this.volume * 100) + '% - music continues');
    }
    
    // ADDED: Save volume specifically for tab switching persistence
    saveVolumeForTabSwitching() {
        try {
            localStorage.setItem('persistentVolume', this.volume.toString());
            // Also save to sessionStorage as backup
            sessionStorage.setItem('currentVolume', this.volume.toString());
        } catch (e) {
            console.warn('Failed to save volume for tab switching:', e);
        }
    }
    
    // ADDED: Load volume when returning to tab
    loadVolumeForTabSwitching() {
        try {
            const savedVolume = localStorage.getItem('persistentVolume') || sessionStorage.getItem('currentVolume');
            if (savedVolume) {
                const volume = parseFloat(savedVolume);
                if (!isNaN(volume) && volume >= 0 && volume <= 1) {
                    this.volume = volume;
                    if (this.audio) {
                        this.audio.volume = this.volume;
                    }
                    if (window.globalAudioInstance && window.globalAudioInstance.audio) {
                        window.globalAudioInstance.audio.volume = this.volume;
                        window.globalAudioInstance.volume = this.volume;
                    }
                    this.updateVolumeDisplay();
                    console.log('🔊 Volume restored from tab switching:', Math.round(this.volume * 100) + '%');
                }
            }
        } catch (e) {
            console.warn('Failed to load volume for tab switching:', e);
        }
    }
    
    updateVolumeDisplay() {
        let volumeValue = document.querySelector('.volume-wheel .volume-value');
        let volumeSlider = document.querySelector('.volume-wheel .volume-slider');
        
        if (!volumeValue) {
            volumeValue = document.querySelector('.volume-control-separate .volume-value');
            volumeSlider = document.querySelector('.volume-control-separate .volume-slider');
        }
        
        if (!volumeValue) {
            volumeValue = document.querySelector('.volume-value');
            volumeSlider = document.querySelector('.volume-slider');
        }
        
        if (volumeValue) {
            volumeValue.textContent = Math.round(this.volume * 100) + '%';
        }
        
        if (volumeSlider) {
            volumeSlider.value = this.volume * 100;
        }
    }
    
    updateButtons() {
        this.syncButtonState();
        
        document.querySelectorAll('.audio-toggle, .persistent-audio-toggle').forEach(button => {
            if (this.isEnabled && this.audio && !this.audio.paused) {
                button.innerHTML = '🔊';
                button.title = 'Turn off ambient music';
                button.classList.add('active');
            } else {
                button.innerHTML = '🎵';
                button.title = 'Turn on ambient music';
                button.classList.remove('active');
            }
        });
        
        this.updateVolumeDisplay();
    }
}

// === VERTICAL VOLUME WHEEL SYSTEM ===
function createVerticalVolumeWheel() {
    // Add volume wheel styles
    addVolumeWheelStyles();
    
    const volumeWheel = document.createElement('div');
    volumeWheel.className = 'volume-wheel';
    volumeWheel.innerHTML = `
        <div class="volume-track" aria-label="Volume slider track"></div>
        <div class="volume-handle" aria-label="Volume control handle" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="15"></div>
        <div class="volume-value" aria-live="polite">15%</div>
    `;
    
    // Position off-screen initially
    volumeWheel.style.opacity = '0';
    volumeWheel.style.visibility = 'hidden';
    volumeWheel.style.transform = 'translateX(-50px)';
    
    document.body.appendChild(volumeWheel);
    
    // Setup volume wheel functionality
    setupVolumeWheelEvents(volumeWheel);
    
    return volumeWheel;
}

function addVolumeWheelStyles() {
    const existingStyle = document.getElementById('volume-wheel-styles');
    if (existingStyle) return;
    
    const style = document.createElement('style');
    style.id = 'volume-wheel-styles';
    style.textContent = `
        .volume-wheel {
            position: fixed;
            z-index: 100000;
            width: 40px;
            height: 140px;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 200, 100, 0.6);
            border-radius: 20px;
            padding: 15px 8px 10px 8px;
            box-shadow: 
                0 0 20px rgba(255, 200, 100, 0.4),
                0 0 40px rgba(255, 180, 80, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            user-select: none;
            overflow: hidden;
        }
        
        .volume-wheel.show {
            opacity: 1 !important;
            visibility: visible !important;
            transform: translateX(0) !important;
        }
        
        .volume-wheel.dragging {
            border-color: rgba(255, 200, 100, 1);
            box-shadow: 
                0 0 25px rgba(255, 200, 100, 0.6),
                0 0 50px rgba(255, 180, 80, 0.3);
        }
        
        .volume-track {
            position: relative;
            width: 4px;
            height: 110px;
            background: linear-gradient(to top, 
                rgba(255, 60, 60, 0.8) 0%,
                rgba(255, 150, 60, 0.8) 30%,
                rgba(255, 200, 100, 0.8) 70%,
                rgba(100, 255, 100, 0.8) 100%
            );
            border-radius: 2px;
            margin: 0 auto;
            box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
        }
        
        .volume-handle {
            position: absolute;
            width: 16px;
            height: 16px;
            background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
            border: 2px solid rgba(255, 200, 100, 0.8);
            border-radius: 50%;
            cursor: grab;
            left: 50%;
            transform: translateX(-50%);
            bottom: calc(10px + 15%);
            box-shadow: 
                0 0 10px rgba(255, 200, 100, 0.6),
                0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
        }
        
        .volume-handle:hover,
        .volume-handle:focus {
            transform: translateX(-50%) scale(1.2);
            border-color: rgba(255, 200, 100, 1);
            box-shadow: 
                0 0 15px rgba(255, 200, 100, 0.8),
                0 4px 12px rgba(0, 0, 0, 0.4);
            outline: 2px solid rgba(255, 200, 100, 0.5);
            outline-offset: 2px;
        }
        
        .volume-handle:active,
        .volume-wheel.dragging .volume-handle {
            cursor: grabbing;
            transform: translateX(-50%) scale(1.1);
            border-color: rgba(255, 200, 100, 1);
            box-shadow: 
                0 0 20px rgba(255, 200, 100, 1),
                0 6px 15px rgba(0, 0, 0, 0.5);
        }
        
        .volume-value {
            position: absolute;
            bottom: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-family: 'Work Sans', sans-serif;
            font-size: 0.7rem;
            color: rgba(255, 200, 100, 0.9);
            font-weight: 600;
            text-align: center;
            min-width: 30px;
            background: rgba(0, 0, 0, 0.6);
            padding: 2px 6px;
            border-radius: 8px;
            border: 1px solid rgba(255, 200, 100, 0.3);
        }
        
        @media (max-width: 768px) {
            .volume-wheel {
                width: 35px;
                height: 130px;
                padding: 8px 6px;
            }
            
            .volume-track {
                width: 6px;
                height: 100px;
            }
            
            .volume-handle {
                width: 18px;
                height: 18px;
            }
        }
        
        @media (prefers-reduced-motion: reduce) {
            .volume-wheel {
                transition: opacity 0.1s ease;
            }
            
            .volume-handle {
                transition: none;
            }
        }
    `;
    
    document.head.appendChild(style);
}

function setupVolumeWheelEvents(volumeWheel) {
    const track = volumeWheel.querySelector('.volume-track');
    const handle = volumeWheel.querySelector('.volume-handle');
    const valueDisplay = volumeWheel.querySelector('.volume-value');
    
    let isDragging = false;
    let lastVolume = 15;
    
    // Position volume wheel relative to audio button
    function positionVolumeWheel(audioButton) {
        const buttonRect = audioButton.getBoundingClientRect();
        const wheelWidth = 40;
        const wheelHeight = 150;
        
        let left = buttonRect.left - wheelWidth - 10;
        let top = buttonRect.top - (wheelHeight / 2) + (buttonRect.height / 2);
        
        if (left < 10) {
            left = buttonRect.right + 10;
        }
        if (top < 10) {
            top = 10;
        }
        if (top + wheelHeight > window.innerHeight - 10) {
            top = window.innerHeight - wheelHeight - 10;
        }
        
        volumeWheel.style.left = left + 'px';
        volumeWheel.style.top = top + 'px';
    }
    
    // Update handle position and value - FIXED: Better bounds to prevent clipping
    function updateVolumeWheel(volume) {
        const percentage = Math.max(0, Math.min(100, volume));
        
        // FIXED: Adjust bounds to prevent handle from clipping out at max
        const trackHeight = 110; // Match CSS height
        const handleHeight = 16; // Match CSS height
        const padding = 15; // Match top padding
        const bottomPadding = 10; // Match bottom padding
        
        // FIXED: Calculate position with proper constraints to prevent clipping
        const availableHeight = trackHeight - (handleHeight / 2); // Account for handle size
        const minPosition = handleHeight / 2; // Start handle radius away from bottom
        const maxPosition = availableHeight - (handleHeight / 2); // End handle radius away from top
        
        const position = (percentage / 100) * (maxPosition - minPosition) + minPosition;
        const constrainedPosition = Math.max(minPosition, Math.min(maxPosition, position));
        
        handle.style.bottom = `calc(${bottomPadding}px + ${constrainedPosition}px)`;
        handle.setAttribute('aria-valuenow', Math.round(percentage));
        valueDisplay.textContent = Math.round(percentage) + '%';
        
        if (Math.abs(percentage - lastVolume) >= 5) {
            announceVolumeChange(Math.round(percentage));
            lastVolume = percentage;
        }
    }
    
    // Calculate volume from mouse/touch position - FIXED: Better bounds checking
    function getVolumeFromPosition(clientY) {
        const trackRect = track.getBoundingClientRect();
        const relativeY = clientY - trackRect.top;
        
        // FIXED: Constrain to track bounds more strictly
        const trackHeight = trackRect.height;
        const clampedY = Math.max(0, Math.min(trackHeight, relativeY));
        const percentage = ((trackHeight - clampedY) / trackHeight) * 100;
        
        // Additional constraint to prevent going outside 0-100%
        return Math.max(0, Math.min(100, percentage)) / 100;
    }
    
    // FIXED: Prevent dragging outside container
    function constrainToTrack(clientY) {
        const trackRect = track.getBoundingClientRect();
        const wheelRect = volumeWheel.getBoundingClientRect();
        
        // Constrain Y position to wheel bounds
        const minY = wheelRect.top + 10; // Account for padding
        const maxY = wheelRect.bottom - 10; // Account for padding
        
        return Math.max(minY, Math.min(maxY, clientY));
    }
    
    // Mouse events - FIXED: Better constraint handling
    track.addEventListener('click', (e) => {
        const constrainedY = constrainToTrack(e.clientY);
        const volume = getVolumeFromPosition(constrainedY);
        if (window.persistentAudioManager) {
            window.persistentAudioManager.setVolume(volume);
        }
        updateVolumeWheel(volume * 100);
    });
    
    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
        
        // Add visual feedback
        handle.style.cursor = 'grabbing';
        volumeWheel.classList.add('dragging');
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // FIXED: Constrain movement to track area
        const constrainedY = constrainToTrack(e.clientY);
        const volume = getVolumeFromPosition(constrainedY);
        
        if (window.persistentAudioManager) {
            window.persistentAudioManager.setVolume(volume);
        }
        updateVolumeWheel(volume * 100);
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handle.style.cursor = 'grab';
            volumeWheel.classList.remove('dragging');
        }
    });
    
    // Touch events - FIXED: Better constraint handling
    track.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const constrainedY = constrainToTrack(touch.clientY);
        const volume = getVolumeFromPosition(constrainedY);
        if (window.persistentAudioManager) {
            window.persistentAudioManager.setVolume(volume);
        }
        updateVolumeWheel(volume * 100);
    });
    
    handle.addEventListener('touchstart', (e) => {
        isDragging = true;
        e.preventDefault();
        volumeWheel.classList.add('dragging');
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const constrainedY = constrainToTrack(touch.clientY);
        const volume = getVolumeFromPosition(constrainedY);
        
        if (window.persistentAudioManager) {
            window.persistentAudioManager.setVolume(volume);
        }
        updateVolumeWheel(volume * 100);
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            volumeWheel.classList.remove('dragging');
        }
    });
    
    // Keyboard navigation - FIXED: Smaller increments for better control
    handle.addEventListener('keydown', (e) => {
        let currentVolume = window.persistentAudioManager ? window.persistentAudioManager.volume : 0.15;
        let newVolume = currentVolume;
        
        switch(e.key) {
            case 'ArrowUp':
                newVolume = Math.min(1, currentVolume + 0.02); // FIXED: Smaller increment (2%)
                e.preventDefault();
                break;
            case 'ArrowDown':
                newVolume = Math.max(0, currentVolume - 0.02); // FIXED: Smaller increment (2%)
                e.preventDefault();
                break;
            case 'Home':
                newVolume = 1;
                e.preventDefault();
                break;
            case 'End':
                newVolume = 0;
                e.preventDefault();
                break;
            case 'PageUp':
                newVolume = Math.min(1, currentVolume + 0.1);
                e.preventDefault();
                break;
            case 'PageDown':
                newVolume = Math.max(0, currentVolume - 0.1);
                e.preventDefault();
                break;
        }
        
        if (newVolume !== currentVolume && window.persistentAudioManager) {
            window.persistentAudioManager.setVolume(newVolume);
            updateVolumeWheel(newVolume * 100);
        }
    });
    
    // Scroll wheel support - FIXED: Smaller increments
    volumeWheel.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        const currentVolume = window.persistentAudioManager ? window.persistentAudioManager.volume : 0.15;
        const delta = e.deltaY > 0 ? -0.02 : 0.02; // FIXED: Smaller increment (2%)
        const newVolume = Math.max(0, Math.min(1, currentVolume + delta));
        
        if (window.persistentAudioManager) {
            window.persistentAudioManager.setVolume(newVolume);
        }
        updateVolumeWheel(newVolume * 100);
    });
    
    // Initialize with current volume
    const initialVolume = window.persistentAudioManager ? window.persistentAudioManager.volume * 100 : 15;
    updateVolumeWheel(initialVolume);
    
    // Store references
    volumeWheel._updateVolumeWheel = updateVolumeWheel;
    volumeWheel._positionVolumeWheel = positionVolumeWheel;
    
    return volumeWheel;
}

// === ENHANCED CONTROL BUTTONS WITH VERTICAL VOLUME WHEEL ===
function addEnhancedControlButtons() {
    if (document.querySelector('.persistent-controls')) return;
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'persistent-controls';
    
    // Create controls label
    const controlsLabel = document.createElement('div');
    controlsLabel.className = 'controls-label';
    controlsLabel.textContent = 'Toggles!';
    
    // Create controls row
    const controlsRow = document.createElement('div');
    controlsRow.className = 'controls-row';
    
    // Create audio button
    const audioButton = document.createElement('button');
    audioButton.className = 'persistent-audio-toggle control-button';
    audioButton.title = 'Toggle ambient music';
    audioButton.innerHTML = '🎵';
    audioButton.setAttribute('aria-label', 'Toggle ambient music');
    
    // Create firefly button
    const fireflyButton = document.createElement('button');
    fireflyButton.className = 'persistent-firefly-toggle control-button';
    fireflyButton.title = 'Toggle firefly particles';
    fireflyButton.innerHTML = '✨';
    fireflyButton.setAttribute('aria-label', 'Toggle firefly particles');
    
    // Append buttons to row
    controlsRow.appendChild(audioButton);
    controlsRow.appendChild(fireflyButton);
    
    // Append to container
    controlsContainer.appendChild(controlsLabel);
    controlsContainer.appendChild(controlsRow);
    
    // Add to body
    document.body.appendChild(controlsContainer);
    
    // Create vertical volume wheel
    const volumeWheel = createVerticalVolumeWheel();
    
    // FIXED: Audio button event handlers with proper focus removal
    audioButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.persistentAudioManager) {
            window.persistentAudioManager.toggle();
        }
        // FIXED: Remove focus after click to prevent staying highlighted
        audioButton.blur();
    });
    
    // Show volume wheel on hover
    audioButton.addEventListener('mouseenter', () => {
        volumeWheel._positionVolumeWheel(audioButton);
        volumeWheel.classList.add('show');
        if (window.persistentAudioManager) {
            const currentVolume = window.persistentAudioManager.volume * 100;
            volumeWheel._updateVolumeWheel(currentVolume);
        }
    });
    
    // Hide volume wheel when mouse leaves button (with delay)
    audioButton.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!volumeWheel.matches(':hover') && !audioButton.matches(':hover')) {
                volumeWheel.classList.remove('show');
            }
        }, 2500);
    });
    
    // Keep volume wheel open when hovering over it
    volumeWheel.addEventListener('mouseenter', () => {
        // Keep it open
    });
    
    // Hide when leaving volume wheel (with delay)
    volumeWheel.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!volumeWheel.matches(':hover') && !audioButton.matches(':hover')) {
                volumeWheel.classList.remove('show');
            }
        }, 2500);
    });
    
    // Prevent volume wheel clicks from bubbling
    volumeWheel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // FIXED: Firefly toggle with focus removal
    fireflyButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.enhancedFireflyEffect) {
            window.enhancedFireflyEffect.toggle();
        }
        // FIXED: Remove focus after click to prevent staying highlighted
        fireflyButton.blur();
    });
    
    // Keyboard support for volume wheel
    audioButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            // Toggle audio
            if (window.persistentAudioManager) {
                window.persistentAudioManager.toggle();
            }
            // FIXED: Remove focus after keyboard activation
            audioButton.blur();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            // Show volume wheel and focus handle
            volumeWheel._positionVolumeWheel(audioButton);
            volumeWheel.classList.add('show');
            const handle = volumeWheel.querySelector('.volume-handle');
            if (handle) {
                handle.focus();
            }
            e.preventDefault();
        }
    });
    
    // FIXED: Firefly keyboard support with focus removal
    fireflyButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (window.enhancedFireflyEffect) {
                window.enhancedFireflyEffect.toggle();
            }
            // FIXED: Remove focus after keyboard activation
            fireflyButton.blur();
        }
    });
    
    // Update button states
    if (window.persistentAudioManager) {
        window.persistentAudioManager.updateButtons();
        window.persistentAudioManager.updateVolumeDisplay();
    }
    if (window.enhancedFireflyEffect) {
        window.enhancedFireflyEffect.updateButtons();
    }
    
    console.log('Enhanced control buttons added with vertical volume wheel');
}

// === ACCESSIBILITY FEATURES ===
function initAccessibilityFeatures() {
    addAccessibilityStyles();
    addSkipNavigation();
    addAriaLabels();
    addKeyboardNavigation();
    addScreenReaderSupport();
    addColorBlindSupport();
    addFocusManagement();
    
    console.log('♿ Accessibility features initialized');
}

function addAccessibilityStyles() {
    const style = document.createElement('style');
    style.id = 'accessibility-styles';
    style.textContent = `
        /* Screen reader only content */
        .sr-only {
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        }
        
        /* Focus indicators */
        *:focus {
            outline: 2px solid rgba(255, 200, 100, 0.8) !important;
            outline-offset: 2px !important;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            body {
                background: #000000 !important;
                color: #ffffff !important;
            }
            
            .homepage-container,
            .project-card,
            .devlog-post,
            .detail-card {
                background: #000000 !important;
                border: 2px solid #ffffff !important;
                color: #ffffff !important;
            }
            
            .nav-tabs li a {
                background: #000000 !important;
                color: #ffffff !important;
                border: 2px solid #ffffff !important;
            }
            
            .nav-tabs li a.active-tab {
                background: #ffffff !important;
                color: #000000 !important;
            }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `;
    document.head.appendChild(style);
}

function addSkipNavigation() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-nav sr-only';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 100001;
        padding: 0.5rem 1rem;
        background: #000000;
        color: #ffffff;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
    `;
    
    skipLink.addEventListener('focus', () => {
        skipLink.classList.remove('sr-only');
    });
    
    skipLink.addEventListener('blur', () => {
        skipLink.classList.add('sr-only');
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content landmark
    const mainContent = document.getElementById('homepage-main');
    if (mainContent) {
        mainContent.id = 'main-content';
        mainContent.setAttribute('role', 'main');
        mainContent.setAttribute('aria-label', 'Main content');
    }
}

function addAriaLabels() {
    // Navigation
    const nav = document.querySelector('.main-nav');
    if (nav) {
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Main navigation');
    }
    
    // Social links
    const socialLinks = document.querySelectorAll('.homepage-socials a');
    socialLinks.forEach(link => {
        const img = link.querySelector('img');
        if (img) {
            const platform = img.alt;
            link.setAttribute('aria-label', `Visit my ${platform} profile`);
        }
    });
    
    // Project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        const title = card.querySelector('h3');
        if (title) {
            card.setAttribute('aria-labelledby', title.textContent.toLowerCase().replace(/\s+/g, '-'));
            title.id = title.textContent.toLowerCase().replace(/\s+/g, '-');
        }
    });
    
    // Forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.setAttribute('role', 'form');
        
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            if (!input.getAttribute('aria-label')) {
                const label = form.querySelector(`label[for="${input.id}"]`);
                if (label) {
                    input.setAttribute('aria-labelledby', label.id || `label-${input.id}`);
                    if (!label.id) {
                        label.id = `label-${input.id}`;
                    }
                }
            }
        });
    });
}

function addKeyboardNavigation() {
    // Tab navigation for all interactive elements
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, [tabindex]');
    interactiveElements.forEach((element, index) => {
        if (!element.hasAttribute('tabindex')) {
            element.setAttribute('tabindex', '0');
        }
    });
    
    // Escape key handlers
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals or panels
            const volumeWheel = document.querySelector('.volume-wheel');
            if (volumeWheel && volumeWheel.classList.contains('show')) {
                volumeWheel.classList.remove('show');
            }
            
            const modal = document.querySelector('.credits-modal.show');
            if (modal) {
                hideCreditsModal();
            }
        }
    });
}

function addScreenReaderSupport() {
    // Live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.id = 'announcements';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    
    // Store reference globally
    window.announceToScreenReader = function(message) {
        liveRegion.textContent = message;
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    };
    
    // Page load announcement
    setTimeout(() => {
        window.announceToScreenReader('Page loaded. Welcome to Chris Summers website.');
    }, 1000);
}

function addColorBlindSupport() {
    // Add visual patterns to color-coded elements
    const addPatternToElements = (selector, pattern) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element && element.textContent && !element.textContent.includes(pattern)) {
                element.textContent = pattern + ' ' + element.textContent;
            }
        });
    };
    
    // Add patterns to different categories
    setTimeout(() => {
        // Project filters
        addPatternToElements('[data-filter="game"]', '●');
        addPatternToElements('[data-filter="web"]', '▲');
        addPatternToElements('[data-filter="ai-ml"]', '■');
        addPatternToElements('[data-filter="design"]', '♦');
        
        // Skill tags - use more specific selectors
        const skillTags = document.querySelectorAll('.skill-tag');
        skillTags.forEach((tag, index) => {
            if (tag && tag.textContent) {
                const pattern = index % 2 === 0 ? '▶' : '▼';
                if (!tag.textContent.includes(pattern)) {
                    tag.textContent = pattern + ' ' + tag.textContent;
                }
            }
        });
        
        // Course tags - check if text contains keywords
        const courseTags = document.querySelectorAll('.course-tag');
        courseTags.forEach(tag => {
            if (tag && tag.textContent) {
                const text = tag.textContent.toLowerCase();
                let pattern = '';
                
                if (text.includes('programming') || text.includes('code') || text.includes('software')) {
                    pattern = '⚡';
                } else if (text.includes('math') || text.includes('calculus') || text.includes('statistics')) {
                    pattern = '∑';
                } else if (text.includes('art') || text.includes('design') || text.includes('visual')) {
                    pattern = '🎨';
                }
                
                if (pattern && !tag.textContent.includes(pattern)) {
                    tag.textContent = pattern + ' ' + tag.textContent;
                }
            }
        });
    }, 500);
}

function addFocusManagement() {
    // Focus trap for modals
    const trapFocus = (element) => {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    };

    // Apply focus trap to modals when they open
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const element = mutation.target;
                if (element.classList.contains('show') && element.classList.contains('credits-modal')) {
                    trapFocus(element);
                }
            }
        });
    });

    const modal = document.querySelector('.credits-modal');
    if (modal) {
        observer.observe(modal, { attributes: true });
    }
}

function announceVolumeChange(volume) {
    if (window.announceToScreenReader) {
        window.announceToScreenReader(`Volume set to ${volume} percent`);
    }
}

// === CREDITS MODAL ===
function initCreditsModal() {
    const footer = document.querySelector('.site-footer');
    if (footer && !footer.querySelector('.credits-button')) {
        const creditsButton = document.createElement('button');
        creditsButton.className = 'credits-button';
        creditsButton.textContent = 'Credits';
        creditsButton.setAttribute('aria-label', 'View website credits and acknowledgments');
        creditsButton.addEventListener('click', showCreditsModal);
        footer.appendChild(creditsButton);
    }
    
    if (!document.querySelector('.credits-modal')) {
        const modal = document.createElement('div');
        modal.className = 'credits-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'credits-title');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="credits-content">
                <button class="credits-close" aria-label="Close credits modal">×</button>
                <h3 id="credits-title">Credits & Thanks</h3>
                <ul class="credits-list">
                    <li><a href="https://fonts.google.com/" target="_blank">Google Fonts</a> - Typography (Bebas Neue, Work Sans, Kalam)</li>
                    <li><a href="https://jquery.com/" target="_blank">jQuery</a> - JavaScript Library</li>
                    <li><a href="https://www.spotify.com/" target="_blank">Spotify Web API</a> - Music Integration</li>
                    <li><a href="https://formsubmit.co/" target="_blank">FormSubmit</a> - Contact Form Service</li>
                    <li><a href="https://dimden.dev/" target="_blank">Dimden</a> - Inspiration for cozy aesthetic</li>
                    <li><a href="https://freesound.org/people/LolaMoore/" target="_blank">LolaMoore</a> - Background ambient music</li>
                    <li><a href="https://www.instagram.com/elias_lozano_garcia/?hl=en" target="_blank">Elias Lozano Garcia</a> - Video Wallpaper (via Pixabay)</li>
                    <li>You - For visiting my little corner of the internet! 💖</li>
                </ul>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const closeButton = modal.querySelector('.credits-close');
        closeButton.addEventListener('click', hideCreditsModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideCreditsModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                hideCreditsModal();
            }
        });
    }
}

function showCreditsModal() {
    const modal = document.querySelector('.credits-modal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus the close button for keyboard users
        const closeButton = modal.querySelector('.credits-close');
        if (closeButton) {
            closeButton.focus();
        }
        
        // Announce to screen readers
        if (window.announceToScreenReader) {
            window.announceToScreenReader('Credits modal opened');
        }
    }
}

function hideCreditsModal() {
    const modal = document.querySelector('.credits-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Return focus to the button that opened the modal
        const creditsButton = document.querySelector('.credits-button');
        if (creditsButton) {
            creditsButton.focus();
        }
        
        // Announce to screen readers
        if (window.announceToScreenReader) {
            window.announceToScreenReader('Credits modal closed');
        }
    }
}

// === RECENT DEVLOGS FETCH ===
function fetchRecentDevLogs() {
    fetch('devlog.html')
    .then(response => response.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const posts = doc.querySelectorAll('.devlog-post');
        const container = document.getElementById("recent-devlogs");

        if (!container) return;

        container.innerHTML = '<h3>Recent Development Updates</h3>';

        if (posts.length === 0) {
            container.innerHTML += '<p style="color: rgba(255,180,100,0.8);">Check back soon!</p>';
            return;
        }

        const postsArray = Array.from(posts);
        // FIX: Since posts are already in newest-first order, just take the first 3
        const latestPosts = postsArray.slice(0, 3); // Take first 3 (newest)
        
        latestPosts.forEach((post) => {
            const id = post.id || '';
            const titleElement = post.querySelector("h2");
            const dateElement = post.querySelector(".devlog-date");
            const excerptElement = post.querySelector(".devlog-excerpt");

            if (!titleElement || !dateElement || !excerptElement) return;

            const title = titleElement.textContent.trim();
            const date = dateElement.textContent.trim();
            const excerpt = excerptElement.textContent.trim();

            const article = document.createElement("article");
            article.className = "homepage-post";
            article.innerHTML = `
                <h3><a href="devlog.html#${id}">${title}</a></h3>
                <p class="post-date">${date}</p>
                <p>${excerpt}</p>
            `;

            container.appendChild(article);
        });
    })
    .catch(err => {
        console.error("Failed to load recent dev logs:", err);
        const container = document.getElementById("recent-devlogs");
        if (container) {
            container.innerHTML = '<h3>Recent Development Updates</h3><p style="color: rgba(255,100,100,0.8);">Failed to load recent updates.</p>';
        }
    });
}

// === GLOBAL ENHANCED CONTROL FUNCTIONS ===
function togglePersistentAudio() {
    if (window.persistentAudioManager) {
        window.persistentAudioManager.toggle();
    }
}

function toggleFireflyEffect() {
    if (window.enhancedFireflyEffect) {
        window.enhancedFireflyEffect.toggle();
    }
}

function toggleRainSound() {
    togglePersistentAudio();
}

// Expose enhanced hanging lights for testing and control
window.refreshHangingLights = function() {
    if (window.enhancedHangingLights) {
        window.enhancedHangingLights.refresh();
    } else {
        initEnhancedHangingLights();
    }
};

window.addMoreLights = function(count = 2) {
    if (window.enhancedHangingLights) {
        window.enhancedHangingLights.addMoreLights(count);
    }
};

window.reduceLights = function(count = 1) {
    if (window.enhancedHangingLights) {
        window.enhancedHangingLights.reduceLights(count);
    }
};

console.log('Enhanced main initialization complete!');
console.log('Available commands:');
console.log('- window.refreshHangingLights() - Regenerate lights with new positions');
console.log('- window.addMoreLights(2) - Add more lights');
console.log('- window.reduceLights(1) - Remove some lights');
console.log('♿ Accessibility features: Screen reader support, keyboard navigation, color blind support');