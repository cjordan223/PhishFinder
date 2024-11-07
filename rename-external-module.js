import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const oldFileName = '__vite-browser-external.js';
const newFileName = 'vite-browser-external.js';

// Rename the externalized module file
fs.renameSync(path.join(distDir, oldFileName), path.join(distDir, newFileName));
console.log(`Renamed ${oldFileName} to ${newFileName}`);

// Update the reference in popup.js
const popupJsPath = path.join(distDir, 'popup.js');
let popupJsContent = fs.readFileSync(popupJsPath, 'utf-8');
popupJsContent = popupJsContent.replace(oldFileName, newFileName);
fs.writeFileSync(popupJsPath, popupJsContent);
console.log(`Updated reference in popup.js from ${oldFileName} to ${newFileName}`);