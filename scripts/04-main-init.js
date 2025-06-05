// 04-main-init.js - Main Initialization and DOM Ready Events

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