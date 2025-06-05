// 01-core-init.js - Navigation, Page Transitions, and Core Initialization

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

// === UTILITY FUNCTIONS ===
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// === INITIALIZATION ===
const pageTransitions = new PageTransitions();

$(document).ready(function () {
    console.log('jQuery DOM ready');
});