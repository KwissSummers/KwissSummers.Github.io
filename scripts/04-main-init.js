// 04-main-init.js - Enhanced Main Initialization with Video Background and Enhanced Hanging Lights

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing enhanced systems...');
    
    // Initialize video background
    initVideoBackground();
    
    // Light rays removed as requested
    
    // Initialize simple hanging lights (no animation)
    initSimpleHangingLights();
    
    // Initialize persistent audio manager with enhanced features
    window.persistentAudioManager = new EnhancedPersistentAudioManager();
    
    // Initialize firefly effect
    window.enhancedFireflyEffect = new EnhancedFireflyEffect();
    window.enhancedFireflyEffect.init();
    
    // Initialize page transitions
    pageTransitions.hideLoading();
    pageTransitions.initPageLoad();
    
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

// === VIDEO BACKGROUND INITIALIZATION ===
function initVideoBackground() {
    // Create wooden frame container first
    const frameContainer = document.createElement('div');
    frameContainer.className = 'wooden-frame-container';
    
    // Create inner content area
    const innerContent = document.createElement('div');
    innerContent.className = 'frame-inner-content';
    
    // Create video background container (now smaller, inside frame)
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-background-framed';
    
    const video = document.createElement('video');
    video.src = 'videos/websiteBackground.mp4';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    
    // Handle video load success/failure
    video.addEventListener('loadeddata', () => {
        console.log('🎬 Framed video background loaded successfully');
    });
    
    video.addEventListener('error', (e) => {
        console.warn('🚫 Video background failed to load, using fallback');
        videoContainer.style.display = 'none';
    });
    
    videoContainer.appendChild(video);
    innerContent.appendChild(videoContainer);
    frameContainer.appendChild(innerContent);
    
    // Insert frame at the beginning of body
    document.body.insertBefore(frameContainer, document.body.firstChild);
    
    // Move all existing content inside the frame
    const existingContent = Array.from(document.body.children).filter(
        child => !child.classList.contains('wooden-frame-container') && 
                !child.classList.contains('hanging-elements') &&
                !child.classList.contains('persistent-controls') &&
                !child.classList.contains('credits-modal')
    );
    
    existingContent.forEach(element => {
        innerContent.appendChild(element);
    });
}

// === LIGHT RAYS COMPLETELY REMOVED ===
// All light rays functionality has been eradicated as requested

// === SIMPLE HANGING LIGHTS (NO ANIMATION) ===
function initSimpleHangingLights() {
    const hangingContainer = document.createElement('div');
    hangingContainer.className = 'hanging-elements';
    
    // Create simple hanging lights with minimum distance
    const positions = [];
    const minDistance = 150; // Minimum distance between lights in pixels
    const maxLights = 4;
    
    for (let i = 0; i < maxLights; i++) {
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 100) {
            const newPos = 15 + Math.random() * 70; // 15% to 85% of screen width
            
            // Check if this position is far enough from existing positions
            const isFarEnough = positions.every(existingPos => {
                const distance = Math.abs(newPos - existingPos) * (window.innerWidth / 100);
                return distance >= minDistance;
            });
            
            if (isFarEnough) {
                positions.push(newPos);
                validPosition = true;
                
                // Create light element
                const element = document.createElement('div');
                element.className = 'hanging-element';
                
                const cord = document.createElement('div');
                cord.className = 'hanging-cord';
                
                const light = document.createElement('div');
                light.className = 'hanging-light';
                
                element.appendChild(cord);
                element.appendChild(light);
                
                // Position the light
                element.style.left = newPos + '%';
                element.style.top = '0px';
                element.style.animationDelay = Math.random() * 6 + 's';
                element.style.animationDuration = (4 + Math.random() * 4) + 's';
                
                hangingContainer.appendChild(element);
            } else {
                attempts++;
            }
        }
        
        if (!validPosition) {
            console.log(`Couldn't place light ${i + 1}, skipping to avoid overlap`);
        }
    }
    
    document.body.appendChild(hangingContainer);
    console.log('💡 Simple hanging lights initialized with spacing');
}

// === ENHANCED PERSISTENT AUDIO MANAGER ===
class EnhancedPersistentAudioManager extends PersistentAudioManager {
    constructor() {
        super();
        this.defaultVolume = 0.5; // Start at 50% volume
        this.volume = this.defaultVolume;
        this.isEnabled = true; // Auto-enable audio
        
        // Set initial volume
        if (this.audio) {
            this.audio.volume = this.defaultVolume;
        }
        
        // Auto-start audio immediately
        this.setupAutoStart();
    }
    
    setupAutoStart() {
        // Try to start audio immediately on page load
        const startAudio = () => {
            this.volume = this.defaultVolume;
            this.setVolume(this.defaultVolume);
            this.startAudio();
            console.log('🎵 Auto-started ambient audio at 50% volume');
        };
        
        // Try immediate start
        setTimeout(startAudio, 100);
        
        // Also try on first user interaction as fallback
        const enableAudioOnInteraction = () => {
            if (!this.isEnabled || this.audio.paused) {
                startAudio();
            }
            document.removeEventListener('click', enableAudioOnInteraction);
            document.removeEventListener('keydown', enableAudioOnInteraction);
        };
        
        document.addEventListener('click', enableAudioOnInteraction, { once: true });
        document.addEventListener('keydown', enableAudioOnInteraction, { once: true });
    }
    
    async startAudio() {
        if (!this.audio) return;
        
        try {
            // Set volume before starting
            this.audio.volume = this.volume;
            
            // Don't restart if already playing
            if (!this.audio.paused) {
                this.isEnabled = true;
                this.saveSettings();
                this.updateButtons();
                this.updateVolumeDisplay();
                return;
            }

            await this.audio.play();
            this.isEnabled = true;
            window.globalAudioInstance.isPlaying = true;
            this.saveSettings();
            this.saveAudioState();
            this.updateButtons();
            this.updateVolumeDisplay();
            console.log('🎵 Audio started at volume:', Math.round(this.volume * 100) + '%');
        } catch (error) {
            console.warn('Audio play failed (will retry on user interaction):', error);
            // Keep enabled state for retry on interaction
            this.isEnabled = true;
            this.updateButtons();
            this.updateVolumeDisplay();
        }
    }
    
    showVolumeControl() {
        const volumeControl = document.querySelector('.volume-control');
        if (volumeControl) {
            volumeControl.classList.add('show');
            // Update display when showing
            this.updateVolumeDisplay();
        }
    }
    
    hideVolumeControl() {
        const volumeControl = document.querySelector('.volume-control');
        if (volumeControl) {
            volumeControl.classList.remove('show');
        }
    }
    
    setVolume(newVolume) {
        this.volume = Math.max(0, Math.min(1, newVolume));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
        this.saveSettings();
        this.saveAudioState();
        this.updateVolumeDisplay();
        console.log('🔊 Volume set to:', Math.round(this.volume * 100) + '%');
    }
    
    updateVolumeDisplay() {
        const volumeValue = document.querySelector('.volume-value');
        if (volumeValue) {
            volumeValue.textContent = Math.round(this.volume * 100) + '%';
        }
        
        const volumeSlider = document.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.value = this.volume * 100;
        }
    }
    
    updateButtons() {
        // Sync state first
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
        
        // Update volume display
        this.updateVolumeDisplay();
    }
}

// === ENHANCED CONTROL BUTTONS ===
function addEnhancedControlButtons() {
    if (document.querySelector('.persistent-controls')) return;
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'persistent-controls';
    controlsContainer.innerHTML = `
        <div class="controls-label">Toggle :)</div>
        <div class="controls-row">
            <button class="persistent-audio-toggle control-button" title="Toggle ambient music">
                🎵
                <div class="volume-control">
                    <div class="volume-label">volume</div>
                    <input type="range" class="volume-slider" min="0" max="100" value="50">
                    <div class="volume-value">50%</div>
                </div>
            </button>
            <button class="persistent-firefly-toggle control-button" title="Toggle firefly particles">
                ✨
            </button>
        </div>
    `;
    
    document.body.appendChild(controlsContainer);
    
    // Setup volume control functionality
    const audioButton = controlsContainer.querySelector('.persistent-audio-toggle');
    const volumeControl = controlsContainer.querySelector('.volume-control');
    const volumeSlider = controlsContainer.querySelector('.volume-slider');
    
    // Toggle audio on click (not just show volume)
    audioButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.persistentAudioManager) {
            window.persistentAudioManager.toggle();
        }
    });
    
    // Show volume control on hover
    audioButton.addEventListener('mouseenter', () => {
        if (window.persistentAudioManager) {
            window.persistentAudioManager.showVolumeControl();
        }
    });
    
    // Hide volume control when mouse leaves button
    audioButton.addEventListener('mouseleave', (e) => {
        // Small delay to allow moving to volume control
        setTimeout(() => {
            if (!volumeControl.matches(':hover') && !audioButton.matches(':hover')) {
                if (window.persistentAudioManager) {
                    window.persistentAudioManager.hideVolumeControl();
                }
            }
        }, 150);
    });
    
    // Keep volume control open when hovering over it
    volumeControl.addEventListener('mouseenter', () => {
        // Keep it open
    });
    
    // Hide when leaving volume control
    volumeControl.addEventListener('mouseleave', () => {
        if (window.persistentAudioManager) {
            window.persistentAudioManager.hideVolumeControl();
        }
    });
    
    // Volume slider functionality
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        if (window.persistentAudioManager) {
            window.persistentAudioManager.setVolume(volume);
        }
    });
    
    // Prevent volume control clicks from bubbling
    volumeControl.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Firefly toggle
    const fireflyButton = controlsContainer.querySelector('.persistent-firefly-toggle');
    fireflyButton.addEventListener('click', () => {
        if (window.enhancedFireflyEffect) {
            window.enhancedFireflyEffect.toggle();
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
    
    console.log('Enhanced control buttons added');
}

// === CREDITS MODAL ===
function initCreditsModal() {
    // Add credits button to footer if it doesn't exist
    const footer = document.querySelector('.site-footer');
    if (footer && !footer.querySelector('.credits-button')) {
        const creditsButton = document.createElement('button');
        creditsButton.className = 'credits-button';
        creditsButton.textContent = 'Credits';
        creditsButton.addEventListener('click', showCreditsModal);
        footer.appendChild(creditsButton);
    }
    
    // Create credits modal if it doesn't exist
    if (!document.querySelector('.credits-modal')) {
        const modal = document.createElement('div');
        modal.className = 'credits-modal';
        modal.innerHTML = `
            <div class="credits-content">
                <button class="credits-close">×</button>
                <h3>Credits & Thanks</h3>
                <ul class="credits-list">
                    <li><a href="https://fonts.google.com/" target="_blank">Google Fonts</a> - Typography</li>
                    <li><a href="https://jquery.com/" target="_blank">jQuery</a> - JavaScript Library</li>
                    <li><a href="https://www.spotify.com/" target="_blank">Spotify Web API</a> - Music Integration</li>
                    <li><a href="https://formsubmit.co/" target="_blank">FormSubmit</a> - Contact Form</li>
                    <li><a href="https://dimden.dev/" target="_blank">Dimden</a> - Inspiration for aesthetic</li>
                    <li>You - For visiting my little corner of the internet! 💖</li>
                </ul>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal functionality
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
    }
}

function hideCreditsModal() {
    const modal = document.querySelector('.credits-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// === UTILITY FUNCTIONS ===
function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        if (random < weights[i]) return items[i];
        random -= weights[i];
    }
    return items[0];
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

// Expose simple hanging lights for testing (no complex animations)
window.refreshHangingLights = function() {
    console.log('Simple hanging lights - no refresh needed');
};