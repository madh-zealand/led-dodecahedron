/**
 * 3D LED Dodecahedron
 *
 * Copyright (c) 2020 Uri Shaked
 * Modified to create dodecahedron outline
 */

const root = document.getElementById('led-cube');
const pixels = [];

const urlParams = new URL(location.href).searchParams;

// Get components from URL parameter, default to 'neopixels' if not specified
const components = urlParams.get('components')?.split(',') || ['neopixels'];

function clamp(n, min, max) {
  return n < min ? min : n > max ? max : n;
}

// ... rest of vertex and edge definitions remain the same ...

// Message handling for multiple components
window.addEventListener('message', ({ data }) => {
  // Loop through all components specified in URL
  for (const component of components) {
    if (data[component] && data[component].pixels) {
      const componentPixels = data[component].pixels;
      
      // Update LEDs for this component
      for (let i = 0; i < componentPixels.length; i++) {
        const value = componentPixels[i];
        const b = value & 0xff;
        const r = (value >> 8) & 0xff;
        const g = (value >> 16) & 0xff;
        if (pixels[i]) {
          pixels[i].setAttribute('color', `rgb(${r}, ${g}, ${b})`);
        }
      }
    }
  }
});

// ... rest of the code remains the same ... 