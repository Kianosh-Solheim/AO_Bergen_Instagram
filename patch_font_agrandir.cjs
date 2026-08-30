const fs = require('fs');

// Patch index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Comic+Neue:ital,wght@0,400;0,700;1,400;1,700&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Syne:wght@600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet" crossorigin="anonymous">',
  '<link href="https://fonts.googleapis.com/css2?family=Comic+Neue:ital,wght@0,400;0,700;1,400;1,700&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,700&family=Syne:wght@600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet" crossorigin="anonymous">'
);
fs.writeFileSync('index.html', html);

// Patch index.css
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace(
  '--font-agrandir: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
  '--font-agrandir: "Agrandir", "Plus Jakarta Sans", "Outfit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;'
);

// Add font-face for Agrandir
const fontFace = `
@font-face {
  font-family: 'Agrandir';
  src: url('https://db.onlinewebfonts.com/t/2c8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Agrandir';
  src: url('https://db.onlinewebfonts.com/t/7b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Agrandir';
  src: url('https://db.onlinewebfonts.com/t/8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b.woff2') format('woff2');
  font-weight: 800;
  font-style: normal;
  font-display: swap;
}

`;

css = fontFace + css;

fs.writeFileSync('src/index.css', css);
