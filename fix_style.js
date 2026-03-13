const fs = require('fs');
let css = fs.readFileSync('c:/Users/OgeaN/Documents/Github/hmwafflemenu/assets/styles.css', 'utf16le');

if (!css.includes('body {')) {
    // If utf16le didn't decode it right, it means it's partly utf8 and partly utf16 or just utf8
    css = fs.readFileSync('c:/Users/OgeaN/Documents/Github/hmwafflemenu/assets/styles.css', 'utf8');
}

// Remove null bytes created by PowerShell >> 
css = css.replace(/\x00/g, '');

// Fix mobile full width items in qrmenu 
css = css.replace('.qr-grid { grid-template-columns: 1fr; }', '.qr-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }');

// Add modern fixes
let fixes = `
/* UI Fixes */
.hero-main-img {
    border-radius: 20% !important;
    aspect-ratio: 1/1 !important;
    object-fit: cover !important;
    background-color: #fff;
    box-shadow: 0px 10px 40px rgba(0,0,0,0.6);
    padding: 0;
}

@media (max-width: 480px) {
    .qr-card { padding: 0.5rem; }
    .qr-card-name { font-size: 0.85rem !important; }
    .qr-card-price { font-size: 1rem !important; }
    .qr-card-img { margin-bottom: 0.5rem !important; aspect-ratio: 1 / 1 !important; }
}
`;

if (!css.includes('.hero-main-img { border-radius: 50% !important;')) {
    css += fixes;
}

fs.writeFileSync('c:/Users/OgeaN/Documents/Github/hmwafflemenu/assets/styles.css', css, 'utf8');
console.log('Fixed CSS OK');
