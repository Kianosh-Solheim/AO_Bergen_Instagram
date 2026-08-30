const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');

const newFontFaces = `
@font-face { font-family: 'Agrandir-GrandHeavy'; src: url('/Fonts/Agrandir-GrandHeavy.otf') format('opentype'); }
@font-face { font-family: 'Agrandir-GrandLight'; src: url('/Fonts/Agrandir-GrandLight.otf') format('opentype'); }
@font-face { font-family: 'Agrandir-Narrow'; src: url('/Fonts/Agrandir-Narrow.otf') format('opentype'); }
@font-face { font-family: 'Agrandir-Regular'; src: url('/Fonts/Agrandir-Regular.otf') format('opentype'); }
@font-face { font-family: 'Agrandir-TextBold'; src: url('/Fonts/Agrandir-TextBold.otf') format('opentype'); }
@font-face { font-family: 'Agrandir-ThinItalic'; src: url('/Fonts/Agrandir-ThinItalic.otf') format('opentype'); }
@font-face { font-family: 'Agrandir-Tight'; src: url('/Fonts/Agrandir-Tight.otf') format('opentype'); }
@font-face { font-family: 'Agrandir-WideBlackItalic'; src: url('/Fonts/Agrandir-WideBlackItalic.otf') format('opentype'); }
@font-face { font-family: 'Agrandir-WideLight'; src: url('/Fonts/Agrandir-WideLight.otf') format('opentype'); }
`;

css = css.replace(/@font-face\s*{[^}]*}\s*/g, '');
css = newFontFaces + '\n' + css;

fs.writeFileSync('src/index.css', css);
