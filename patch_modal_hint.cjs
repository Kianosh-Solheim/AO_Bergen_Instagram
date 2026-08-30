const fs = require('fs');
let code = fs.readFileSync('src/components/ImageUploaderModal.tsx', 'utf8');

code = code.replace(
  '<label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">\n              Forhåndsvisning med utsnitt og zoom\n            </label>',
  '<label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">\n              Forhåndsvisning (Dra i bildet for å posisjonere, scroll for å zoome)\n            </label>'
);

fs.writeFileSync('src/components/ImageUploaderModal.tsx', code);
