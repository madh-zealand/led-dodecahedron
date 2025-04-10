/**
 * 3D LED Dodecahedron
 *
 * Copyright (c) 2020 Uri Shaked
 * Modified to create dodecahedron outline
 */

// ===== CONFIGURATION =====
const root = document.getElementById('led-dodecahedron');
const scale = 0.8; // Scale factor for the dodecahedron size
const ledsPerEdge = 8; // Number of LEDs per edge

// Get components from URL parameter, default to 'neopixels' if not specified
const urlParams = new URL(location.href).searchParams;
const components = urlParams.get('components')?.split(',') || ['neopixels'];
const isDebugging = urlParams.get('debug') === 'true';
!isDebugging || console.log('Is debugging: ', isDebugging);
!isDebugging || console.log('Reading from components: ', components);

// ===== GEOMETRY DEFINITION =====
// Golden ratio for proper dodecahedron proportions
const phi = (1 + Math.sqrt(5)) / 2;

// Calculate vertices for a regular dodecahedron using the golden ratio
const vertices = [
    // The vertices of a regular dodecahedron
    [1, 1, 1],           // 0
    [1, 1, -1],          // 1
    [1, -1, 1],          // 2
    [1, -1, -1],         // 3
    [-1, 1, 1],          // 4
    [-1, 1, -1],         // 5
    [-1, -1, 1],         // 6
    [-1, -1, -1],        // 7
    [0, phi, 1/phi],     // 8
    [0, phi, -1/phi],    // 9
    [0, -phi, 1/phi],    // 10
    [0, -phi, -1/phi],   // 11
    [1/phi, 0, phi],     // 12
    [-1/phi, 0, phi],    // 13
    [1/phi, 0, -phi],    // 14
    [-1/phi, 0, -phi],   // 15
    [phi, 1/phi, 0],     // 16
    [phi, -1/phi, 0],    // 17
    [-phi, 1/phi, 0],    // 18
    [-phi, -1/phi, 0]    // 19
];

// Correct edges for a regular dodecahedron
const edges = [
  // Ring
  [11, 7], [7, 19], [19, 18], [18, 4], [4, 8], [8, 0], [0, 16], [16, 17], [17, 3], [3, 11],
  // Side 1
  [12, 13], [13, 4], [13, 6], [6, 19], [6, 10], [10, 11], [10, 2], [2, 17], [2, 12], [12, 0],
  // Side 2
  [5, 15], [15, 7], [15, 14], [14, 3], [14, 1], [1, 16], [1, 9], [9, 8], [9, 5], [5, 18],
];

// ===== STATE MANAGEMENT =====
const pixels = []; // Array to store all LED elements
const componentStates = {}; // Store the latest state for each component
const componentPixelCounts = {}; // Track the number of pixels for each component
const componentsReceived = new Set(); // Track which components have been received
const componentStartIndices = {}; // Store the starting index for each component
let validationComplete = false; // Track if validation has been completed

// Calculate total number of LEDs
const totalLeds = edges.length * ledsPerEdge;

// ===== UI ELEMENTS =====
// Create error message element
const errorElement = document.createElement('div');
errorElement.style.position = 'absolute';
errorElement.style.top = '10px';
errorElement.style.left = '10px';
errorElement.style.color = 'red';
errorElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
errorElement.style.padding = '10px';
errorElement.style.borderRadius = '5px';
errorElement.style.zIndex = '1000';
errorElement.style.display = 'none';
document.body.appendChild(errorElement);

// ===== LED CREATION =====
/**
 * Creates all LEDs for the dodecahedron
 */
function createLEDs() {
  let index = 0;
  
  // Place LEDs along each edge
  edges.forEach(([v1, v2]) => {
    const [x1, y1, z1] = vertices[v1];
    const [x2, y2, z2] = vertices[v2];
    
    for (let i = 0; i < ledsPerEdge; i++) {
      const t = (i + 1) / (ledsPerEdge - 1 + 2);
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const z = z1 + (z2 - z1) * t;
      
      const led = document.createElement('a-led');
      led.setAttribute('position', {
        x: x * scale,
        y: y * scale,
        z: z * scale
      });
      root.appendChild(led);
      pixels[index++] = led;
    }
  });
  
  !isDebugging || console.log(`Created ${index} LEDs`);
}

// ===== COMPONENT VALIDATION =====
/**
 * Validates that all components have been received and checks if the total pixel count matches
 */
function validateComponentData() {
  // Check if all components have been received at least once
  const allComponentsReceived = components.every(component => componentsReceived.has(component));
  
  if (allComponentsReceived) {
    // Calculate total pixels from all components
    const totalComponentPixels = Object.values(componentPixelCounts).reduce((sum, count) => sum + count, 0);
    
    !isDebugging || console.log(`Total component pixels: ${totalComponentPixels}, Total LEDs: ${totalLeds}`);
    
    // Check if the total matches
    if (totalComponentPixels !== totalLeds) {
      const errorMessage = `Error: Total component pixels (${totalComponentPixels}) does not match total LEDs (${totalLeds})`;
      console.error(errorMessage);
      
      // Show error message on screen
      errorElement.textContent = errorMessage;
      errorElement.style.display = 'block';
      
      // Log component details
      !isDebugging || console.log('Component pixel counts:', componentPixelCounts);
    
    } else {
      // Hide error message if counts match
      errorElement.style.display = 'none';
      // Mark validation as complete
      validationComplete = true;
    }
  } else {
    // Show error message on screen
    errorElement.textContent = `Waiting to recieve components: ` + components.filter(component => !componentsReceived.has(component)).join(', ');
    errorElement.style.display = 'block';
  }
}

/**
 * Recalculates all component start indices based on the current state
 * This ensures correct indices even if components are received out of order
 */
function recalculateAllStartIndices() {
  // Reset all start indices
  Object.keys(componentStartIndices).forEach(key => {
    delete componentStartIndices[key];
  });
  
  // Calculate start indices for all components in the correct order
  let currentIndex = 0;
  for (const component of components) {
    if (componentStates[component]) {
      componentStartIndices[component] = currentIndex;
      currentIndex += componentStates[component].length;
      !isDebugging || console.log(`Component ${component} starts at index ${componentStartIndices[component]}`);
    }
  }
}

/**
 * Processes a message event containing component data
 * @param {MessageEvent} event - The message event
 */
function processMessageEvent(event) {
  // Track which components have been updated in this event
  const updatedComponents = new Set();
  let newComponentsReceived = false;
  
  // Check if the event contains any of our components
  for (const component of components) {
    if (event.data[component] && event.data[component].pixels) {
      const componentPixels = event.data[component].pixels;
      
      // Store the current state for this component
      componentStates[component] = [...componentPixels];
      
      // Record the pixel count for this component
      componentPixelCounts[component] = componentPixels.length;
      
      // Check if this is the first time we're seeing this component
      if (!componentsReceived.has(component)) {
        newComponentsReceived = true;
        componentsReceived.add(component);
        !isDebugging || console.log(`First time receiving data for component: ${component}`);
      }
      
      // Mark this component as updated
      updatedComponents.add(component);
      //console.log(`Updated data for component: ${component} with ${componentPixels.length} pixels`);
    }
  }
  
  // If we've received all components at least once, recalculate start indices
  const allComponentsReceived = components.every(component => componentsReceived.has(component));
  if (allComponentsReceived && newComponentsReceived) {
    !isDebugging || console.log('All components received at least once, calculating start indices');
    recalculateAllStartIndices();
    
    // Validate component data only once when all components are received
    if (!validationComplete) {
      validateComponentData();
    }
  } else if (newComponentsReceived && !validationComplete) {
    // If we received new components but not all yet, update the waiting message
    validateComponentData();
  }
  
  // Update all pixels based on the latest component data
  updateAllPixels();
}

/**
 * Updates all pixels based on the latest component data
 */
function updateAllPixels() {
  // Create a mapping of pixel index to color
  const pixelColors = new Array(totalLeds).fill(null);
  
  // Process each component in order
  for (const component of components) {
    if (componentStates[component] && componentStartIndices[component] !== undefined) {
      const componentPixels = componentStates[component];
      const startIndex = componentStartIndices[component];
      
      // Update the pixel colors for this component
      for (let i = 0; i < componentPixels.length; i++) {
        const pixelIndex = startIndex + i;
        if (pixelIndex < totalLeds) {
          const value = componentPixels[i];
          const b = value & 0xff;
          const r = (value >> 8) & 0xff;
          const g = (value >> 16) & 0xff;
          pixelColors[pixelIndex] = `rgb(${r}, ${g}, ${b})`;
        }
      }
    }
  }
  
  // Apply the colors to the pixels
  for (let i = 0; i < totalLeds; i++) {
    if (pixelColors[i] && pixels[i]) {
      pixels[i].setAttribute('color', pixelColors[i]);
    }
  }
}

// ===== INITIALIZATION =====
// Create all LEDs
createLEDs();

// Start listening for component data
parent.postMessage({ app: 'wokwi', command: 'listen', version: 1 }, '*');

// Listen for messages from the parent
window.addEventListener('message', processMessageEvent);

// ===== UI CONTROLS =====
// Set up spin button
const spinButton = document.getElementById('option-spin');
spinButton.addEventListener('change', () => {
  if (spinButton.checked) {
    root.components.animation.play();
  } else {
    root.components.animation.pause();
  }
});

// Set up button1
const button1 = document.getElementById("button1");
button1.addEventListener("click", () => {
  // Emulate physical button via Serial
  parent.postMessage({ type: "serial", action: "input", data: "button1\n" }, "*");
});

// this.dispatchEvent(
//   new MessageEvent("message", {
//     bubbles: true,
//     data: {
//       strip1: {
//         pixels: Array(80).fill(255),
//       },
//       strip2: {
//         pixels: Array(80).fill(0),
//       },
//       strip3: {
//         pixels: Array(80).fill(0),
//       },
//     },
//   }),
// );
