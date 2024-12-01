import fs from 'fs';
import path from 'path';

export default function renamePlugin() {
  return {
    name: 'rename-plugin',
    async closeBundle() {
      const distDir = path.resolve('dist');
      const files = fs.readdirSync(distDir);
      const renamedFiles = new Map();
      
      // First pass: Rename all files
      for (const file of files) {
        if (file.startsWith('_') || file.startsWith('__')) {
          const newFileName = file.replace(/^_+/, '');
          const oldFilePath = path.join(distDir, file);
          const newFilePath = path.join(distDir, newFileName);
          
          try {
            if (fs.existsSync(oldFilePath)) {
              fs.renameSync(oldFilePath, newFilePath);
              renamedFiles.set(file, newFileName);
              console.log(`Renamed ${file} to ${newFileName}`);
            }
          } catch (error) {
            console.warn(`Warning: Could not rename ${file}: ${error.message}`);
          }
        }
      }

      // Second pass: Update references after all files are renamed
      const updatedFiles = fs.readdirSync(distDir);
      for (const [oldFile, newFile] of renamedFiles) {
        for (const refFile of updatedFiles) {
          const refFilePath = path.join(distDir, refFile);
          try {
            if (fs.statSync(refFilePath).isFile()) {
              let content = fs.readFileSync(refFilePath, 'utf-8');
              if (content.includes(oldFile)) {
                content = content.replace(new RegExp(oldFile, 'g'), newFile);
                fs.writeFileSync(refFilePath, content);
                console.log(`Updated references in ${refFile} from ${oldFile} to ${newFile}`);
              }
            }
          } catch (error) {
            console.warn(`Warning: Could not process ${refFile}: ${error.message}`);
          }
        }
      }
    }
  };
}