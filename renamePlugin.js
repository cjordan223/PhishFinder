import fs from 'fs';
import path from 'path';

export default function renamePlugin() {
  return {
    name: 'rename-plugin',
    closeBundle() {
      const distDir = path.resolve('dist');
      const oldFileNames = ['_plugin-vue_export-helper.js', '_plugin-vue_export-helper.css'];
      const newFileNames = ['plugin-vue-export-helper.js', 'plugin-vue-export-helper.css'];

      oldFileNames.forEach((oldFileName, index) => {
        const newFileName = newFileNames[index];

        // Rename the file
        const oldFilePath = path.join(distDir, oldFileName);
        const newFilePath = path.join(distDir, newFileName);
        if (fs.existsSync(oldFilePath)) {
          fs.renameSync(oldFilePath, newFilePath);
          console.log(`Renamed ${oldFileName} to ${newFileName}`);
        }

        // Update references in all files in the dist directory
        const files = fs.readdirSync(distDir);
        files.forEach((file) => {
          const filePath = path.join(distDir, file);
          if (fs.lstatSync(filePath).isFile()) {
            let content = fs.readFileSync(filePath, 'utf-8');
            content = content.replace(new RegExp(oldFileName, 'g'), newFileName);
            fs.writeFileSync(filePath, content);
          }
        });
      });
    },
  };
}