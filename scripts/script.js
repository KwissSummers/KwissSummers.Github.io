// script.js - Fixed version with true audio persistence

// === IMMEDIATE ACTIVE TAB SETTER ===
(function() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    function setActiveTabImmediate() {
        const navLinks = document.querySelectorAll('.nav-tabs a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.remove('active-tab');
            
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html') ||
                (currentPage === 'index.html' && href === 'index.html') ||
                currentPath.includes(href.replace('.html', ''))) {
                link.classList.add('active-tab');
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setActiveTabImmediate);
    } else {
        setActiveTabImmediate();
    }
    
    window.addEventListener('load', setActiveTabImmediate);
})();

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

// === PAGE TRANSITION HANDLER CLASS ===
class PageTransitions {
    constructor() {
        this.isTransitioning = false;
        this.transitionDuration = 400;
    }

    initPageLoad() {
        const main = document.getElementById('homepage-main');
        if (main) {
            main.classList.add('page-transition-slide-up');
            setTimeout(() => {
                main.classList.add('page-loaded');
            }, 50);
        }
    }

    handleTabNavigation(href, event) {
        if (this.isTransitioning) return false;
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const targetPage = href;
        
        if (currentPage === targetPage) return false;
        
        event.preventDefault();
        this.isTransitioning = true;
        
        // Save audio state before navigation (don't stop the audio)
        if (window.persistentAudioManager) {
            window.persistentAudioManager.saveAudioState();
        }
        
        this.showLoading();
        
        const main = document.getElementById('homepage-main');
        if (main) {
            main.style.opacity = '0';
            main.style.transform = 'translateY(-20px)';
        }
        
        setTimeout(() => {
            window.location.href = href;
        }, this.transitionDuration / 2);
        
        return false;
    }

    showLoading() {
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="loading-spinner"></div>';
            document.body.appendChild(overlay);
        }
        
        setTimeout(() => {
            overlay.classList.add('show');
        }, 100);
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
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

// === INITIALIZATION ===
const pageTransitions = new PageTransitions();

$(document).ready(function () {
    console.log('jQuery DOM ready');
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing all systems...');
    
    // Initialize persistent audio manager
    window.persistentAudioManager = new PersistentAudioManager();
    
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
    
    // Add tiny control buttons
    addTinyControlButtons();
    
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
    
    console.log('All systems initialized successfully');
});

// === TINY CONTROL BUTTONS ===
function addTinyControlButtons() {
    if (document.querySelector('.persistent-controls')) return;
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'persistent-controls';
    controlsContainer.innerHTML = `
        <button class="persistent-audio-toggle control-button" onclick="togglePersistentAudio()" title="Toggle ambient music">
            🎵
        </button>
        <button class="persistent-firefly-toggle control-button" onclick="toggleFireflyEffect()" title="Toggle firefly particles">
            ✨
        </button>
    `;
    
    document.body.appendChild(controlsContainer);
    
    if (window.persistentAudioManager) {
        window.persistentAudioManager.updateButtons();
    }
    if (window.enhancedFireflyEffect) {
        window.enhancedFireflyEffect.updateButtons();
    }
    
    console.log('Tiny control buttons added');
}

// === NAVIGATION SYSTEM ===
function initNavigationWithTransitions() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    document.querySelectorAll(".nav-tabs a").forEach(link => {
        const href = link.getAttribute("href");
        
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            currentPath.includes(href.replace('.html', ''))) {
            link.classList.add("active-tab");
        }
        
        link.addEventListener('click', (event) => {
            if (href !== currentPage) {
                return pageTransitions.handleTabNavigation(href, event);
            }
        });
    });
}

// === CONTACT FORM ===
function initContactForm() {
    const form = document.getElementById("contact-form");
    const popup = document.getElementById("contact-thanks");

    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        
        const email = document.getElementById("email").value;
        const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;

        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }
        
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.textContent = 'Sending...';

        const formData = new FormData(form);
        const emailTarget = form.getAttribute('data-formsubmit') || 'chris4summers@outlook.com';
        
        fetch(`https://formsubmit.co/ajax/${emailTarget}`, {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            form.reset();
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            submitButton.textContent = originalText;
            
            popup.classList.add("show");
            setTimeout(() => {
                popup.classList.remove("show");
            }, 4000);
        })
        .catch(error => {
            console.error('Form submission error:', error);
            alert('There was a problem sending your message. Please try again later.');
            
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
            submitButton.textContent = originalText;
        });
    });
}

// === CONTENT TOGGLE FUNCTIONALITY ===
function initDevlogToggle() {
    document.querySelectorAll(".devlog-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const devlogPost = button.closest('.devlog-post');
            const fullContent = devlogPost.querySelector('.devlog-full');
            
            if (fullContent) {
                fullContent.hidden = !fullContent.hidden;
                button.textContent = fullContent.hidden ? "Read More" : "Show Less";
            } else {
                const fullPost = button.nextElementSibling;
                if (fullPost) {
                    fullPost.hidden = !fullPost.hidden;
                    button.textContent = fullPost.hidden ? "Read More" : "Show Less";
                }
            }
        });
    });
}

function initBlogToggle() {
    const blogToggles = document.querySelectorAll('.blog-toggle');
    blogToggles.forEach(button => {
        button.addEventListener('click', function() {
            const blogPost = this.closest('.blog-post');
            const fullContent = blogPost.querySelector('.blog-full');
            
            if (fullContent) {
                fullContent.hidden = !fullContent.hidden;
                this.textContent = fullContent.hidden ? "Read More" : "Show Less";
            }
        });
    });
}

// === BLOG FILTERING SYSTEM ===
function initBlogFiltering() {
    if (!window.location.pathname.includes('blog.html')) return;
    
    const categoryLinks = document.querySelectorAll('[data-category]');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            
            categoryLinks.forEach(l => l.classList.remove('filter-active'));
            document.querySelectorAll('[data-tag]').forEach(t => t.classList.remove('filter-active'));
            this.classList.add('filter-active');
            
            filterPosts('category', category);
        });
    });

    const tagButtons = document.querySelectorAll('[data-tag]');
    tagButtons.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagName = this.getAttribute('data-tag');
            
            tagButtons.forEach(t => t.classList.remove('filter-active'));
            categoryLinks.forEach(l => l.classList.remove('filter-active'));
            this.classList.add('filter-active');
            
            filterPosts('tag', tagName);
        });
    });

    function filterPosts(filterType, filterValue) {
        const posts = document.querySelectorAll('.blog-post');
        
        posts.forEach(post => {
            let shouldShow = false;
            
            if (filterValue === 'all') {
                shouldShow = true;
            } else if (filterType === 'category') {
                const postCategory = post.getAttribute('data-category');
                shouldShow = postCategory === filterValue;
            } else if (filterType === 'tag') {
                const postTags = post.getAttribute('data-tags');
                if (postTags) {
                    const tagsArray = postTags.split(',').map(tag => tag.trim());
                    shouldShow = tagsArray.includes(filterValue);
                }
            }
            
            if (shouldShow) {
                post.style.display = 'block';
                post.removeAttribute('data-filtered');
            } else {
                post.style.display = 'none';
                post.setAttribute('data-filtered', 'true');
            }
        });
    }
}

// === SMOOTH SCROLLING ===
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: 'start' });
            }
        });
    });

    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: 'start' });
            }
        }, 100);
    }
}

// === HOMEPAGE CONTENT LOADING ===
function fetchRecentDevLogs() {
    const cacheBuster = `?cb=${Date.now()}&r=${Math.random()}`;
    
    fetch(`devlog.html${cacheBuster}`, {
        cache: 'no-cache',
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const posts = doc.querySelectorAll(".devlog-posts .devlog-post");
        const container = document.getElementById("recent-devlogs");

        if (!container) return;

        container.innerHTML = '<h3>Recent Development Updates</h3>';

        if (posts.length === 0) {
            container.innerHTML += '<p style="color: rgba(255,255,255,0.6);">No dev logs found. Check back soon!</p>';
            return;
        }

        const postsArray = Array.from(posts);
        const latestPosts = postsArray.slice(-3).reverse();
        
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

// === UTILITY FUNCTIONS ===
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}