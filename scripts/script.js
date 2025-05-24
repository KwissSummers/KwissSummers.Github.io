// script.js

// jQuery DOM Ready (for future use)
$(document).ready(function () {
  // Future homepage scripts here
});

// Toggle Devlog Posts (Expand/Collapse)
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".devlog-toggle").forEach(button => {
    button.addEventListener("click", () => {
      const fullPost = button.nextElementSibling;
      fullPost.hidden = !fullPost.hidden;
      button.textContent = fullPost.hidden ? "Read More" : "Show Less";
    });
  });
});

// Contact Form Validation & AJAX Submission
document.addEventListener("DOMContentLoaded", function () {
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
      submitButton.disabled = true;
      submitButton.classList.add('loading');

      // Create FormData object from the form
      const formData = new FormData(form);
      
      // Submit the form using fetch API
      fetch('https://formsubmit.co/ajax/odesai840@gmail.com', {
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
      });
    });
  }
});

// Smooth Scroll for Internal Anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Highlight Active Navbar Tab
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".nav-tabs a").forEach(link => {
    if (window.location.pathname.includes(link.getAttribute("href"))) {
      link.classList.add("active-tab");
    }
  });
});

// Reverted back to showing only 2 devlogs
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

      // Take the first 2 posts (reverted back from 3)
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

document.addEventListener("DOMContentLoaded", fetchRecentDevLogs);