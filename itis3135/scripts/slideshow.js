// Global variable to keep track of current slide
let slideIndex = 1;

// Function to show slides
function showSlides(n) {
    let i;
    const slides = document.getElementsByClassName("slide");
    const dots = document.getElementsByClassName("dot");
    const thumbnails = document.getElementsByClassName("thumbnail");
    
    // Loop back to first slide if n exceeds number of slides
    if (n > slides.length) {
        slideIndex = 1;
    }
    
    // Loop to last slide if n is less than 1
    if (n < 1) {
        slideIndex = slides.length;
    }
    
    // Hide all slides
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    
    // Remove active class from all dots
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
        dots[i].style.backgroundColor = "#D9A95A"; // Reset to gold color
    }
    
    // Remove active class from all thumbnails
    for (i = 0; i < thumbnails.length; i++) {
        thumbnails[i].className = thumbnails[i].className.replace(" active", "");
        thumbnails[i].style.borderColor = "#6B4F31"; // Reset border to brown
    }
    
    // Show the current slide
    slides[slideIndex-1].style.display = "block";
    
    // Add active class to the current dot and thumbnail
    dots[slideIndex-1].className += " active";
    dots[slideIndex-1].style.backgroundColor = "#6B4F31"; // Change to brown
    
    thumbnails[slideIndex-1].className += " active";
    thumbnails[slideIndex-1].style.borderColor = "#2C6B2F"; // Change to green
}

// Next/previous controls
function plusSlides(n) {
    showSlides(slideIndex += n);
}

// Thumbnail image controls
function currentSlide(n) {
    showSlides(slideIndex = n);
}

// Wait for the document to fully load before executing code
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the slideshow with a slight delay to ensure images are loaded
    setTimeout(function() {
        showSlides(1);
    }, 100);
    
    // Auto advance slides every 5 seconds
    let slideInterval = setInterval(function() {
        plusSlides(1);
    }, 5000);
    
    // Pause auto-advance when user hovers over the slideshow container or thumbnails
    const slideshowContainer = document.querySelector('.slideshow-container');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    
    if (slideshowContainer) {
        slideshowContainer.addEventListener('mouseenter', function() {
            clearInterval(slideInterval);
        });
        
        slideshowContainer.addEventListener('mouseleave', function() {
            // Resume auto-advance when mouse leaves the container
            clearInterval(slideInterval);
            slideInterval = setInterval(function() {
                plusSlides(1);
            }, 5000);
        });
    }
    
    if (thumbnailContainer) {
        thumbnailContainer.addEventListener('mouseenter', function() {
            clearInterval(slideInterval);
        });
        
        thumbnailContainer.addEventListener('mouseleave', function() {
            // Resume auto-advance when mouse leaves the thumbnails
            clearInterval(slideInterval);
            slideInterval = setInterval(function() {
                plusSlides(1);
            }, 5000);
        });
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            plusSlides(-1);
        } else if (e.key === 'ArrowRight') {
            plusSlides(1);
        }
    });
    
    // Make thumbnails highlight when hovered
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(function(thumb) {
        thumb.addEventListener('mouseenter', function() {
            this.style.borderColor = '#2C6B2F'; // Change border to green on hover
        });
        
        thumb.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.borderColor = '#6B4F31'; // Change back to brown if not active
            }
        });
    });
});