const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'src', 'assets', 'icons');

// Create directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Base64 encoded SVG icons
const icons = {
  'police-car.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AkEEjYV7T4mZQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAGUlEQVQ4y2NgGAWjYBSMglEwCkYBAAD//wMABP8D9g6fRgAAAABJRU5ErkJggg==',
  'ambulance.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AkEEjYV7T4mZQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAF0lEQVQ4y2NgGAWjYBSMglEwCkYBAAD//wMABP8D9g6fRgAAAABJRU5ErkJggg==',
  'fire-truck.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AkEEjYV7T4mZQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAFklEQVQ4y2NgGAWjYBSMglEwCkYBAAD//wMABP8D9g6fRgAAAABJRU5ErkJggg==',
  'responder.png': 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AkEEjYV7T4mZQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAFUlEQVQ4y2NgGAWjYBSMglEwCkYBAAD//wMABP8D9g6fRgAAAABJRU5ErkJggg==',
};

// Save icons
Object.entries(icons).forEach(([filename, base64Data]) => {
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(path.join(iconsDir, filename), buffer);
  console.log(`Created: ${filename}`);
});

console.log('All icons have been generated successfully!');
