// script.js - Enhanced version with all functionality + Transitions + FIXED RAIN

// IMMEDIATELY set active tab to prevent white flash on load - ENHANCED
(function() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    console.log('Current path:', currentPath, 'Current page:', currentPage);
    
    // Function to set active tab immediately
    function setActiveTabImmediate() {
        const navLinks = document.querySelectorAll('.nav-tabs a');
        console.log('Found nav links:', navLinks.length);
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.remove('active-tab'); // Clear all first
            
            // More comprehensive matching
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html') ||
                (currentPage === 'index.html' && href === 'index.html') ||
                currentPath.includes(href.replace('.html', ''))) {
                
                console.log('Setting active tab for:', href);
                link.classList.add('active-tab');
            }
        });
    }
    
    // Try to set immediately if DOM is already ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setActiveTabImmediate);
    } else {
        setActiveTabImmediate();
    }
    
    // Also set on window load as backup
    window.addEventListener('load', setActiveTabImmediate);
})();

// NEW: Page transition handler
class PageTransitions {
    constructor() {
        this.isTransitioning = false;
        this.transitionDuration = 400; // milliseconds
    }

    // Initialize page load animation
    initPageLoad() {
        // Add transition class to main content
        const main = document.getElementById('homepage-main');
        if (main) {
            main.classList.add('page-transition-slide-up');
            
            // Trigger animation after a short delay
            setTimeout(() => {
                main.classList.add('page-loaded');
            }, 50);
        }
    }

    // Handle tab navigation with transitions
    handleTabNavigation(href, event) {
        if (this.isTransitioning) return false;
        
        // Don't animate if it's the same page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const targetPage = href;
        
        if (currentPage === targetPage) return false;
        
        event.preventDefault();
        this.isTransitioning = true;
        
        // Show loading overlay (optional)
        this.showLoading();
        
        // Fade out current content
        const main = document.getElementById('homepage-main');
        if (main) {
            main.style.opacity = '0';
            main.style.transform = 'translateY(-20px)';
        }
        
        // Navigate after transition
        setTimeout(() => {
            window.location.href = href;
        }, this.transitionDuration / 2);
        
        return false;
    }

    // Show loading overlay
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

    // Hide loading overlay
    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }
}

// Initialize page transitions
const pageTransitions = new PageTransitions();

// jQuery DOM Ready (for future use)
$(document).ready(function () {
  // Future homepage scripts here
});

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // NEW: Hide loading overlay if it exists
    pageTransitions.hideLoading();
    
    // NEW: Initialize page load animation
    pageTransitions.initPageLoad();
    
    // Initialize all functionality (ENHANCED navigation)
    initNavigationWithTransitions(); // Enhanced version with transitions
    initContactForm();
    initDevlogToggle();
    initBlogToggle();
    initBlogFiltering();
    initSmoothScroll();
    
    // Load recent devlogs on homepage
    if (document.getElementById('recent-devlogs')) {
        fetchRecentDevLogs();
    }
    
    // IMPORTANT: Initialize firefly effect here
    initializeFireflyEffect();
});

// Navigation functionality - Enhanced active tab highlighting + TRANSITIONS
function initNavigationWithTransitions() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    document.querySelectorAll(".nav-tabs a").forEach(link => {
        const href = link.getAttribute("href");
        
        // More comprehensive matching
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            currentPath.includes(href.replace('.html', ''))) {
            link.classList.add("active-tab");
        }
        
        // NEW: Add transition click handler
        link.addEventListener('click', (event) => {
            // Only apply transitions to different pages
            if (href !== currentPage) {
                return pageTransitions.handleTabNavigation(href, event);
            }
        });
    });
}

// ORIGINAL: Navigation functionality - Enhanced active tab highlighting
function initNavigation() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    document.querySelectorAll(".nav-tabs a").forEach(link => {
        const href = link.getAttribute("href");
        
        // More comprehensive matching
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            currentPath.includes(href.replace('.html', ''))) {
            link.classList.add("active-tab");
        }
    });
}

// Contact Form functionality - Enhanced with better error handling
function initContactForm() {
    const form = document.getElementById("contact-form");
    const popup = document.getElementById("contact-thanks");

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault(); // Prevent the default form submission
            
            // Validate email format
            const email = document.getElementById("email").value;
            const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;

            if (!emailPattern.test(email)) {
                alert("Please enter a valid email address.");
                return;
            }
            
            // Disable the submit button and add loading indicator
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            submitButton.textContent = 'Sending...';

            // Create FormData object from the form
            const formData = new FormData(form);
            
            // Get email from data attribute, fallback to hardcoded
            const emailTarget = form.getAttribute('data-formsubmit') || 'chris4summers@outlook.com';
            
            // Submit the form using fetch API
            fetch(`https://formsubmit.co/ajax/${emailTarget}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Form submitted successfully
                console.log('Form submitted successfully:', data);
                form.reset();
                
                // Re-enable the submit button and remove loading indicator
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
                submitButton.textContent = originalText;
                
                // Show thank you message
                popup.classList.add("show");
                
                // Hide thank you message after 4 seconds
                setTimeout(() => {
                    popup.classList.remove("show");
                }, 4000);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was a problem sending your message. Please try again later.');
                
                // Re-enable the submit button and remove loading indicator
                submitButton.disabled = false;
                submitButton.classList.remove('loading');
                submitButton.textContent = originalText;
            });
        });
    }
}

// DevLog toggle functionality - Enhanced
function initDevlogToggle() {
    document.querySelectorAll(".devlog-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const devlogPost = button.closest('.devlog-post');
            const fullContent = devlogPost.querySelector('.devlog-full');
            
            if (fullContent) {
                fullContent.hidden = !fullContent.hidden;
                button.textContent = fullContent.hidden ? "Read More" : "Show Less";
            } else {
                // Fallback for old structure
                const fullPost = button.nextElementSibling;
                if (fullPost) {
                    fullPost.hidden = !fullPost.hidden;
                    button.textContent = fullPost.hidden ? "Read More" : "Show Less";
                }
            }
        });
    });
}

// Blog toggle functionality - Match devlog exactly
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

// Blog filtering functionality - New functionality
function initBlogFiltering() {
    // Only initialize if we're on the blog page
    if (!window.location.pathname.includes('blog.html')) return;
    
    // Category filtering
    const categoryLinks = document.querySelectorAll('[data-category]');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.getAttribute('data-category');
            
            // Remove active state from all category links and tags
            categoryLinks.forEach(l => l.classList.remove('filter-active'));
            document.querySelectorAll('[data-tag]').forEach(t => t.classList.remove('filter-active'));
            // Add active state to clicked link
            this.classList.add('filter-active');
            
            filterPosts('category', category);
        });
    });

    // Tag filtering
    const tagButtons = document.querySelectorAll('[data-tag]');
    tagButtons.forEach(tag => {
        tag.addEventListener('click', function() {
            const tagName = this.getAttribute('data-tag');
            
            // Remove active state from all tags and categories
            tagButtons.forEach(t => t.classList.remove('filter-active'));
            categoryLinks.forEach(l => l.classList.remove('filter-active'));
            // Add active state to clicked tag
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
            
            // Use display instead of hidden to avoid conflicts with toggle
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

// Smooth Scroll for Internal Anchors - Enhanced
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

    // Handle hash links on page load
    if (window.location.hash) {
        setTimeout(() => {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: 'start' });
            }
        }, 100);
    }
}

// Fixed Fetch Recent DevLogs for Homepage - Cache Busting Version
function fetchRecentDevLogs() {
    // Force fresh content with multiple cache busting techniques
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
        
        // Get posts from the devlog layout
        const posts = doc.querySelectorAll(".devlog-posts .devlog-post");
        const container = document.getElementById("recent-devlogs");

        if (!container) {
            console.warn("recent-devlogs container not found");
            return;
        }

        // Clear container and add header
        container.innerHTML = '<h3>Recent Development Updates</h3>';

        if (posts.length === 0) {
            container.innerHTML += '<p style="color: rgba(255,255,255,0.6);">No dev logs found. Check back soon!</p>';
            return;
        }

        // Convert to Array and get the last 3 posts (newest)
        const postsArray = Array.from(posts);
        const latestPosts = postsArray.slice(-3).reverse(); // Get last 3, newest first
        
        latestPosts.forEach((post) => {
            const id = post.id || '';
            const titleElement = post.querySelector("h2");
            const dateElement = post.querySelector(".devlog-date");
            const excerptElement = post.querySelector(".devlog-excerpt");

            // Skip if any required elements are missing
            if (!titleElement || !dateElement || !excerptElement) {
                console.warn("Missing required elements in devlog post", id);
                return;
            }

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

        console.log(`Loaded ${latestPosts.length} recent devlog posts`);
    })
    .catch(err => {
        console.error("Failed to load recent dev logs:", err);
        const container = document.getElementById("recent-devlogs");
        if (container) {
            container.innerHTML = '<h3>Recent Development Updates</h3><p style="color: rgba(255,100,100,0.8);">Failed to load recent updates.</p>';
        }
    });
}

// Utility functions
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// === FIREFLY ATMOSPHERE JAVASCRIPT ===
// Firefly Effect Class
class FireflyEffect {
    constructor() {
        this.fireflyContainer = document.getElementById('rainContainer');
        this.isActive = true;
        this.fireflyInterval = null;
        this.audio = null;
        this.audioEnabled = false;
        this.maxFireflies = 15; // Limit number of fireflies
        this.currentFireflies = 0;
        
        console.log('FireflyEffect constructor called, fireflyContainer:', this.fireflyContainer);
    }

    init() {
        if (!this.fireflyContainer) {
            console.warn('Firefly container not found, firefly effect disabled');
            return;
        }
        
        console.log('Initializing firefly effect...');
        this.startFireflies();
        this.setupAudio();
    }

    startFireflies() {
        if (!this.isActive || !this.fireflyContainer) return;
        
        console.log('Starting fireflies...');
        this.fireflyInterval = setInterval(() => {
            if (this.currentFireflies < this.maxFireflies) {
                this.createFirefly();
            }
        }, 800); // Create a new firefly every 800ms
    }

    createFirefly() {
        if (!this.fireflyContainer || this.currentFireflies >= this.maxFireflies) return;
        
        const firefly = document.createElement('div');
        firefly.className = 'rain-drop'; // Reusing the rain-drop class name
        
        // Random position across the screen
        const leftPosition = Math.random() * 95; // Keep within viewport
        const topPosition = Math.random() * 90; // Random starting height
        firefly.style.left = leftPosition + '%';
        firefly.style.top = topPosition + '%';
        
        // Enhanced firefly types with silver and pink
        const fireflyTypes = ['gold', 'blue', 'green', 'silver', 'pink', 'light', 'medium', 'heavy'];
        const weights = [25, 15, 20, 15, 15, 5, 3, 2]; // More variety with new colors
        const randomType = this.weightedRandom(fireflyTypes, weights);
        firefly.classList.add(randomType);
        
        // Random animation delay for natural movement
        const delay = Math.random() * 3;
        firefly.style.setProperty('--delay', delay + 's');
        
        // Add hover interaction
        firefly.addEventListener('mouseenter', () => {
            firefly.style.zIndex = '10';
        });
        
        firefly.addEventListener('mouseleave', () => {
            firefly.style.zIndex = '1';
        });
        
        // Add to container
        this.fireflyContainer.appendChild(firefly);
        this.currentFireflies++;
        
        // Remove after animation cycle (based on animation duration)
        const duration = randomType === 'heavy' ? 6500 : 
                        randomType === 'green' ? 7000 :
                        randomType === 'pink' ? 7500 :
                        randomType === 'gold' ? 8000 :
                        randomType === 'medium' ? 8500 :
                        randomType === 'silver' ? 8500 :
                        randomType === 'blue' ? 9000 : 10000;
        
        setTimeout(() => {
            if (firefly.parentNode) {
                firefly.parentNode.removeChild(firefly);
                this.currentFireflies--;
            }
        }, duration);
    }

    weightedRandom(items, weights) {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < items.length; i++) {
            if (random < weights[i]) {
                return items[i];
            }
            random -= weights[i];
        }
        
        return items[0];
    }

    setupAudio() {
        // Placeholder for ambient forest/night sounds
        this.audio = {
            play: () => {
                console.log('🌙 Ambient night sounds started');
                // To add real audio: 
                // const audio = new Audio('path/to/night-ambient.mp3');
                // audio.loop = true;
                // audio.volume = 0.2;
                // audio.play();
            },
            pause: () => {
                console.log('🔇 Ambient sounds stopped');
            },
            volume: 0.2
        };
    }

    toggleAudio() {
        if (this.audioEnabled) {
            this.audio.pause();
            this.audioEnabled = false;
        } else {
            this.audio.play();
            this.audioEnabled = true;
        }
        
        // Update button text
        const button = document.querySelector('.audio-toggle');
        if (button) {
            button.textContent = this.audioEnabled ? '🔇 Stop Ambience' : '🌙 Night Sounds';
        }
    }

    stop() {
        this.isActive = false;
        if (this.fireflyInterval) {
            clearInterval(this.fireflyInterval);
            this.fireflyInterval = null;
        }
        console.log('Fireflies stopped');
    }

    restart() {
        this.isActive = true;
        this.startFireflies();
        console.log('Fireflies restarted');
    }
}

// Initialize firefly effect when DOM is loaded
let fireflyEffect;

function initializeFireflyEffect() {
    console.log('Initializing firefly effect...');
    fireflyEffect = new FireflyEffect();
    fireflyEffect.init();
    
    // Pause fireflies when page is not visible (performance optimization)
    document.addEventListener('visibilitychange', () => {
        if (fireflyEffect) {
            if (document.hidden) {
                fireflyEffect.stop();
            } else {
                fireflyEffect.restart();
            }
        }
    });
}

// Global function for audio toggle button
function toggleRainSound() {
    console.log('toggleAmbientSound called');
    if (fireflyEffect) {
        fireflyEffect.toggleAudio();
    } else {
        console.warn('Firefly effect not initialized');
    }
}