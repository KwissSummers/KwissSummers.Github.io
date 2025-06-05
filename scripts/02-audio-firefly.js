// 02-audio-firefly.js - Audio Manager and Firefly Effects

// === GLOBAL AUDIO INSTANCE - CREATED IMMEDIATELY ===
// This ensures audio survives page navigation
if (!window.globalAudioInstance) {
    window.globalAudioInstance = {
        audio: null,
        isPlaying: false,
        volume: 0.3,
        audioFile: 'audio/ambient-loop.mp3',
        
        // Initialize the actual audio object
        init: function() {
            if (!this.audio) {
                this.audio = new Audio(this.audioFile);
                this.audio.loop = true;
                this.audio.volume = this.volume;
                this.audio.preload = 'auto';
                
                // Store reference globally to prevent garbage collection
                window.persistentAudioElement = this.audio;
                
                this.audio.addEventListener('loadeddata', () => {
                    console.log('🎵 Global audio loaded');
                });
                
                this.audio.addEventListener('error', (e) => {
                    console.warn('🚫 Global audio error:', e);
                });
            }
            return this.audio;
        },
        
        // Get the current playback state
        getState: function() {
            if (!this.audio) return { playing: false, time: 0 };
            return {
                playing: !this.audio.paused && !this.audio.ended,
                time: this.audio.currentTime || 0,
                volume: this.audio.volume || 0.3
            };
        },
        
        // Set the playback state
        setState: function(playing, time, volume) {
            if (!this.audio) this.init();
            
            if (typeof volume !== 'undefined') {
                this.audio.volume = volume;
                this.volume = volume;
            }
            
            if (typeof time !== 'undefined' && !isNaN(time)) {
                this.audio.currentTime = time;
            }
            
            this.isPlaying = playing;
            
            if (playing && this.audio.paused) {
                this.audio.play().catch(console.warn);
            } else if (!playing && !this.audio.paused) {
                this.audio.pause();
            }
        }
    };
    
    // Initialize immediately
    window.globalAudioInstance.init();
}

// === PERSISTENT AUDIO MANAGER CLASS ===
class PersistentAudioManager {
    constructor() {
        this.storageKey = 'audio_settings';
        this.stateKey = 'audio_current_state';
        this.volume = 0.3;
        this.isEnabled = false;
        
        // Use the global audio instance
        this.audio = window.globalAudioInstance.audio;
        
        this.loadSettings();
        this.restoreAudioState();
        this.setupStateTracking();
    }

    // Load user preferences
    loadSettings() {
        try {
            const settings = localStorage.getItem(this.storageKey);
            if (settings) {
                const parsed = JSON.parse(settings);
                this.isEnabled = parsed.audioEnabled || false;
                this.volume = parsed.volume || 0.3;
                
                if (this.audio) {
                    this.audio.volume = this.volume;
                }
            }
        } catch (e) {
            console.warn('Failed to load audio settings:', e);
        }
    }

    // Save user preferences
    saveSettings() {
        try {
            const settings = {
                audioEnabled: this.isEnabled,
                volume: this.volume
            };
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save audio settings:', e);
        }
    }

    // Save current audio state
    saveAudioState() {
        try {
            if (this.audio) {
                const state = {
                    playing: this.isEnabled && !this.audio.paused,
                    time: this.audio.currentTime || 0,
                    volume: this.audio.volume || 0.3,
                    timestamp: Date.now()
                };
                localStorage.setItem(this.stateKey, JSON.stringify(state));
                window.globalAudioInstance.isPlaying = state.playing;
            }
        } catch (e) {
            console.warn('Failed to save audio state:', e);
        }
    }

    // Restore audio state from previous session
    restoreAudioState() {
        try {
            const stateData = localStorage.getItem(this.stateKey);
            if (stateData) {
                const state = JSON.parse(stateData);
                
                // Only restore if the state is recent (within 1 hour)
                if (Date.now() - state.timestamp < 3600000) {
                    this.volume = state.volume || 0.3;
                    
                    if (this.audio) {
                        this.audio.volume = this.volume;
                        
                        // Restore playback position
                        if (state.time && !isNaN(state.time)) {
                            this.audio.currentTime = state.time;
                        }
                        
                        // Restore playing state if was enabled
                        if (this.isEnabled && state.playing) {
                            this.startAudio();
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to restore audio state:', e);
        }
    }

    // Setup continuous state tracking
    setupStateTracking() {
        // Save state periodically while playing
        setInterval(() => {
            if (this.audio && this.isEnabled) {
                this.saveAudioState();
            }
        }, 2000);

        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            this.saveAudioState();
        });

        // Save state on visibility change
        document.addEventListener('visibilitychange', () => {
            this.saveAudioState();
        });

        // Handle audio events
        if (this.audio) {
            this.audio.addEventListener('play', () => {
                window.globalAudioInstance.isPlaying = true;
                this.saveAudioState();
            });

            this.audio.addEventListener('pause', () => {
                window.globalAudioInstance.isPlaying = false;
                this.saveAudioState();
            });

            this.audio.addEventListener('ended', () => {
                if (this.isEnabled) {
                    this.audio.currentTime = 0;
                    this.audio.play().catch(console.warn);
                }
            });
        }
    }

    async startAudio() {
        if (!this.audio) return;
        
        try {
            // Don't restart if already playing
            if (!this.audio.paused) {
                this.isEnabled = true;
                this.saveSettings();
                this.updateButtons();
                return;
            }

            await this.audio.play();
            this.isEnabled = true;
            window.globalAudioInstance.isPlaying = true;
            this.saveSettings();
            this.saveAudioState();
            this.updateButtons();
            console.log('🎵 Audio started');
        } catch (error) {
            console.warn('Audio play failed:', error);
            // Reset state on failure
            this.isEnabled = false;
            window.globalAudioInstance.isPlaying = false;
            this.updateButtons();
        }
    }

    stopAudio() {
        if (!this.audio) return;
        
        this.audio.pause();
        this.isEnabled = false;
        window.globalAudioInstance.isPlaying = false;
        this.saveSettings();
        this.saveAudioState();
        this.updateButtons();
        console.log('🔇 Audio stopped');
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
        this.saveSettings();
        this.saveAudioState();
    }

    // Sync button state with actual audio state
    syncButtonState() {
        if (this.audio) {
            const actuallyPlaying = !this.audio.paused && !this.audio.ended;
            if (this.isEnabled !== actuallyPlaying) {
                this.isEnabled = actuallyPlaying;
                this.saveSettings();
            }
        }
    }

    updateButtons() {
        // Sync state first
        this.syncButtonState();
        
        document.querySelectorAll('.audio-toggle, .persistent-audio-toggle').forEach(button => {
            if (this.isEnabled) {
                button.innerHTML = '🔊';
                button.title = 'Turn off ambient music';
                button.classList.add('active');
            } else {
                button.innerHTML = '🎵';
                button.title = 'Turn on ambient music';
                button.classList.remove('active');
            }
        });
    }
}

// === ENHANCED FIREFLY EFFECT CLASS ===
class EnhancedFireflyEffect {
    constructor() {
        this.fireflyContainer = document.getElementById('rainContainer');
        this.isActive = true;
        this.isEnabled = true;
        this.fireflyInterval = null;
        this.maxFireflies = 15;
        this.currentFireflies = 0;
        this.fireflyElements = new Set();
        this.storageKey = 'firefly_settings';
        
        this.loadSettings();
    }

    loadSettings() {
        const settings = localStorage.getItem(this.storageKey);
        if (settings) {
            const parsed = JSON.parse(settings);
            this.isEnabled = parsed.enabled !== false;
        }
    }

    saveSettings() {
        const settings = { enabled: this.isEnabled };
        localStorage.setItem(this.storageKey, JSON.stringify(settings));
    }

    init() {
        if (!this.fireflyContainer) return;
        
        this.addFireflyStyles();
        if (this.isEnabled) {
            this.startFireflies();
        }
        this.updateButtons();
    }

    addFireflyStyles() {
        if (document.getElementById('firefly-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'firefly-styles';
        style.textContent = `
            @keyframes firefly-fizzle {
                0% { opacity: 1; transform: scale(1); filter: brightness(1); }
                50% { opacity: 0.8; transform: scale(1.2); filter: brightness(1.5); }
                80% { opacity: 0.3; transform: scale(0.8); filter: brightness(0.7); }
                100% { opacity: 0; transform: scale(0.3); filter: brightness(0); }
            }

            @keyframes firefly-sparkle {
                0%, 100% { box-shadow: 0 0 8px currentColor, 0 0 15px currentColor; }
                50% { box-shadow: 0 0 15px currentColor, 0 0 25px currentColor, 0 0 35px currentColor; }
            }

            .firefly-fizzling {
                animation: firefly-fizzle 0.8s ease-out forwards !important;
                pointer-events: none;
            }

            .rain-drop {
                animation-name: firefly-float, firefly-sparkle;
                animation-duration: 8s, 2s;
                animation-timing-function: ease-in-out, ease-in-out;
                animation-iteration-count: 1, infinite;
                animation-delay: var(--delay, 0s), calc(var(--delay, 0s) + 1s);
            }

            .rain-drop.blue { color: rgba(100, 200, 255, 0.9); }
            .rain-drop.gold { color: rgba(255, 215, 100, 0.9); }
            .rain-drop.green { color: rgba(100, 255, 150, 0.9); }
            .rain-drop.silver { color: rgba(220, 220, 220, 0.9); }
            .rain-drop.pink { color: rgba(255, 150, 200, 0.9); }
        `;
        document.head.appendChild(style);
    }

    startFireflies() {
        if (!this.isActive || !this.fireflyContainer || !this.isEnabled) return;
        
        this.fireflyInterval = setInterval(() => {
            if (this.currentFireflies < this.maxFireflies && this.isEnabled) {
                this.createFirefly();
            }
        }, 1000);
    }

    createFirefly() {
        if (!this.fireflyContainer || this.currentFireflies >= this.maxFireflies || !this.isEnabled) return;
        
        const firefly = document.createElement('div');
        firefly.className = 'rain-drop';
        
        const leftPosition = Math.random() * 95;
        const topPosition = Math.random() * 90;
        firefly.style.left = leftPosition + '%';
        firefly.style.top = topPosition + '%';
        
        const fireflyTypes = ['gold', 'blue', 'green', 'silver', 'pink', 'light', 'medium', 'heavy'];
        const weights = [30, 20, 25, 10, 10, 3, 1, 1];
        const randomType = this.weightedRandom(fireflyTypes, weights);
        firefly.classList.add(randomType);
        
        const delay = Math.random() * 3;
        firefly.style.setProperty('--delay', delay + 's');
        
        firefly.addEventListener('mouseenter', () => {
            firefly.style.zIndex = '10';
            firefly.style.transform = 'scale(1.5)';
            this.playFireflyChime();
        });
        
        firefly.addEventListener('mouseleave', () => {
            firefly.style.zIndex = '1';
            firefly.style.transform = 'scale(1)';
        });
        
        firefly.addEventListener('click', () => {
            this.fizzleFirefly(firefly);
        });
        
        this.fireflyContainer.appendChild(firefly);
        this.fireflyElements.add(firefly);
        this.currentFireflies++;
        
        const duration = this.getFireflyDuration(randomType);
        
        setTimeout(() => {
            this.fizzleFirefly(firefly);
        }, duration - 800);
        
        setTimeout(() => {
            this.removeFirefly(firefly);
        }, duration);
    }

    fizzleFirefly(firefly) {
        if (!firefly.parentNode || firefly.classList.contains('firefly-fizzling')) return;
        
        firefly.classList.add('firefly-fizzling');
        this.playFireflyPop();
    }

    removeFirefly(firefly) {
        if (firefly.parentNode) {
            firefly.parentNode.removeChild(firefly);
            this.fireflyElements.delete(firefly);
            this.currentFireflies--;
        }
    }

    getFireflyDuration(type) {
        const durations = {
            heavy: 6500, green: 7000, pink: 7500, gold: 8000,
            medium: 8500, silver: 8500, blue: 9000, light: 10000
        };
        return durations[type] || 8000;
    }

    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            if (random < weights[i]) return items[i];
            random -= weights[i];
        }
        return items[0];
    }

    playFireflyChime() {
        if (window.persistentAudioManager && window.persistentAudioManager.isEnabled) {
            this.createTone(800, 0.1, 0.03);
        }
    }

    playFireflyPop() {
        if (window.persistentAudioManager && window.persistentAudioManager.isEnabled) {
            this.createTone(400, 0.05, 0.02);
        }
    }

    createTone(frequency, duration, volume = 0.1) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Could not create audio tone:', error);
        }
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        this.saveSettings();
        
        if (this.isEnabled) {
            this.startFireflies();
        } else {
            this.stopFireflies();
        }
        
        this.updateButtons();
    }

    stopFireflies() {
        if (this.fireflyInterval) {
            clearInterval(this.fireflyInterval);
            this.fireflyInterval = null;
        }
        
        this.fireflyElements.forEach(firefly => {
            this.fizzleFirefly(firefly);
        });
    }

    updateButtons() {
        document.querySelectorAll('.firefly-toggle, .persistent-firefly-toggle').forEach(button => {
            if (this.isEnabled) {
                button.innerHTML = '✨';
                button.title = 'Turn off firefly particles';
                button.classList.add('active');
            } else {
                button.innerHTML = '🌙';
                button.title = 'Turn on firefly particles';
                button.classList.remove('active');
            }
        });
    }

    stop() {
        this.isActive = false;
        this.stopFireflies();
    }

    restart() {
        this.isActive = true;
        if (this.isEnabled) {
            this.startFireflies();
        }
    }
}

// === GLOBAL CONTROL FUNCTIONS ===
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