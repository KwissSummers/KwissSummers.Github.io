// script.js - Enhanced version with all functionality

// IMMEDIATELY set active tab to prevent white flash on load
(function() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Function to set active tab immediately
    function setActiveTabImmediate() {
        const navLinks = document.querySelectorAll('.nav-tabs a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || 
                (currentPage === '' && href === 'index.html') ||
                currentPath.includes(href.replace('.html', ''))) {
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
})();

// jQuery DOM Ready (for future use)
$(document).ready(function () {
  // Future homepage scripts here
});

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initContactForm();
    initDevlogToggle();
    initBlogToggle();
    initBlogFiltering();
    initSmoothScroll();
    
    // Load recent devlogs on homepage
    if (document.getElementById('recent-devlogs')) {
        fetchRecentDevLogs();
    }
});

// Navigation functionality - Enhanced active tab highlighting
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

// Blog toggle functionality - New functionality
function initBlogToggle() {
    const blogToggles = document.querySelectorAll('.blog-toggle');
    blogToggles.forEach(button => {
        button.addEventListener('click', function() {
            const blogPost = this.closest('.blog-post');
            const fullContent = blogPost.querySelector('.blog-full');
            
            if (fullContent.hidden) {
                fullContent.hidden = false;
                this.textContent = 'Show Less';
            } else {
                fullContent.hidden = true;
                this.textContent = 'Read More';
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
            
            if (shouldShow) {
                post.classList.remove('hidden');
            } else {
                post.classList.add('hidden');
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

// Fetch Recent DevLogs for Homepage - Keep your existing logic
function fetchRecentDevLogs() {
    fetch("devlog.html")
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const posts = doc.querySelectorAll(".devlog-post");
            const container = document.getElementById("recent-devlogs");

            // Clear any existing content in the container
            if (container) {
                // Keep the header if it exists
                const header = container.querySelector("h3");
                container.innerHTML = "";
                if (header) {
                    container.appendChild(header);
                } else {
                    // Add header if it doesn't exist
                    const newHeader = document.createElement("h3");
                    newHeader.textContent = "Recent Development Updates";
                    container.appendChild(newHeader);
                }
            }

            // Take the first 2 posts (as per your preference)
            posts.forEach((post, i) => {
                if (i > 1) return; // Show only 2 posts

                const id = post.id;
                const title = post.querySelector("h2")?.textContent.trim();
                const date = post.querySelector(".devlog-date")?.textContent.trim();
                const excerpt = post.querySelector(".devlog-excerpt")?.textContent.trim();

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
        .catch(err => console.error("Failed to load recent dev logs:", err));
}

// Initialize recent devlogs on page load
document.addEventListener("DOMContentLoaded", fetchRecentDevLogs);

// Utility functions
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}