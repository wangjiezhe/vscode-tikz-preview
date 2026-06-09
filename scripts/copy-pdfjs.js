const fs = require('fs');
const path = require('path');

const mediaDir = path.join(__dirname, '..', 'media');
if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
}

const files = ['pdf.min.mjs', 'pdf.worker.min.mjs'];
for (const file of files) {
    const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', file);
    const dest = path.join(mediaDir, file.replace('.mjs', '.js'));
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to media/${path.basename(dest)}`);
}
