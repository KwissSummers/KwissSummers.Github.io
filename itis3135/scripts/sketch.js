// Global variables
let canvas;

function setup() {
    // Create a canvas that fits nicely within your main content area
    canvas = createCanvas(600, 400);
    
    // Position the canvas within the container div
    canvas.parent('canvas-container');
    
    // Set background color to match your site's theme
    background(255, 253, 248); // Slightly off-white to match your form background
    
    // Set initial stroke properties
    strokeWeight(4);
    stroke(44, 107, 47); // Dark leafy green to match your site's color scheme
}

function draw() {
    // Only draw when the mouse is pressed
    if (mouseIsPressed) {
        // Create a colorful, gradient-like effect based on mouse position
        let r = map(mouseX, 0, width, 44, 107);
        let g = map(mouseY, 0, height, 107, 47);
        let b = map(mouseX + mouseY, 0, width + height, 47, 144);
        
        stroke(r, g, b);
        
        // Draw a line from the previous mouse position to the current position
        line(pmouseX, pmouseY, mouseX, mouseY);
    }
}

// Clear the canvas when double-clicked
function doubleClicked() {
    background(255, 253, 248);
}

// Save the drawing when 's' key is pressed
function keyPressed() {
    if (key === 's' || key === 'S') {
        saveCanvas(canvas, 'my-drawing', 'png');
    }
}