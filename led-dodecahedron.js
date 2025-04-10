/**
 * 3D LED Dodecahedron
 *
 * Copyright (c) 2020 Uri Shaked
 * Modified to create dodecahedron outline
 */

const root = document.getElementById('led-dodecahedron');
const pixels = [];

const urlParams = new URL(location.href).searchParams;
// Get components from URL parameter, default to 'neopixels' if not specified
const components = urlParams.get('components')?.split(',') || ['neopixels'];
console.log('Reading from components: ', components);

function clamp(n, min, max) {
  return n < min ? min : n > max ? max : n;
}

// Increased scale for larger size
const scale = 0.8;
let index = 0;

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

const ledsPerEdge = 8;

// Store the last known state for each component
const componentStates = {};

// Create a mapping for each component to track which LED corresponds to which component pixel
const componentMappings = {};

// Initialize mappings for each component
components.forEach(component => {
  componentMappings[component] = [];
});

// Place LEDs along each edge
edges.forEach(([v1, v2], edgeIndex) => {
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
        pixels[index] = led;
        
        // Store the edge and position information for this LED
        const ledInfo = {
            edgeIndex,
            positionInEdge: i,
            globalIndex: index
        };
        
        // For each component, store the mapping information
        components.forEach(component => {
            componentMappings[component].push(ledInfo);
        });
        
        index++;
    }
});

// pixels[0].setAttribute('color', `rgb(255, 255, 255)`);
// pixels[1].setAttribute('color', `rgb(255, 0, 0)`);
// pixels[2].setAttribute('color', `rgb(0, 255, 0)`);
// pixels[3].setAttribute('color', `rgb(0, 0, 255)`);
// pixels[4].setAttribute('color', `rgb(255, 255, 255)`);
// pixels[5].setAttribute('color', `rgb(200, 200, 200)`);
// pixels[6].setAttribute('color', `rgb(150, 150, 150)`);
// pixels[7].setAttribute('color', `rgb(100, 100, 100)`);

// pixels[8].setAttribute('color', `rgb(0, 255, 255)`);
// pixels[9].setAttribute('color', `rgb(255, 0, 255)`);
// pixels[10].setAttribute('color', `rgb(255, 255, 0)`);

parent.postMessage({ app: 'wokwi', command: 'listen', version: 1 }, '*');

window.addEventListener('message', (event) => {
  // Track which components have been updated in this event
  const updatedComponents = new Set();
  
  // Check if the event contains any of our components
  for (const component of components) {
    if (event.data[component] && event.data[component].pixels) {
      const componentPixels = event.data[component].pixels;
      
      // Store the current state for this component
      componentStates[component] = [...componentPixels];
      
      // Update LEDs for this component using the mapping
      for (let i = 0; i < componentPixels.length; i++) {
        if (i < componentMappings[component].length) {
          const ledInfo = componentMappings[component][i];
          const ledIndex = ledInfo.globalIndex;
          const value = componentPixels[i];
          const b = value & 0xff;
          const r = (value >> 8) & 0xff;
          const g = (value >> 16) & 0xff;
          
          if (pixels[ledIndex]) {
            pixels[ledIndex].setAttribute('color', `rgb(${r}, ${g}, ${b})`);
          }
        }
      }
      
      // Mark this component as updated
      updatedComponents.add(component);
      console.log(`Updated LEDs for component: ${component}`);
    }
  }
  
  // Log which components were not in this event
  const missingComponents = components.filter(c => !updatedComponents.has(c));
  if (missingComponents.length > 0) {
    console.log(`Event did not contain data for components: ${missingComponents.join(', ')}`);
    
    // Optionally, you could reapply the last known state for missing components
    // This is commented out by default as it depends on your specific requirements
    /*
    for (const component of missingComponents) {
      if (componentStates[component]) {
        const componentPixels = componentStates[component];
        for (let i = 0; i < componentPixels.length; i++) {
          if (i < componentMappings[component].length) {
            const ledInfo = componentMappings[component][i];
            const ledIndex = ledInfo.globalIndex;
            const value = componentPixels[i];
            const b = value & 0xff;
            const r = (value >> 8) & 0xff;
            const g = (value >> 16) & 0xff;
            if (pixels[ledIndex]) {
              pixels[ledIndex].setAttribute('color', `rgb(${r}, ${g}, ${b})`);
            }
          }
        }
      }
    }
    */
  }
});

const spinButton = document.getElementById('option-spin');
spinButton.addEventListener('change', () => {
  if (spinButton.checked) {
    root.components.animation.play();
  } else {
    root.components.animation.pause();
  }
});

const button1 = document.getElementById("button1");
button1.addEventListener("click", () => {
  // Emulate physical button via Serial
  parent.postMessage({ type: "serial", action: "input", data: "button1\n" }, "*");
});
