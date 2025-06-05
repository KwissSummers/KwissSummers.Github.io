// 03-forms-content.js - Contact Form, Content Toggles, Blog Filtering, Homepage Content

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