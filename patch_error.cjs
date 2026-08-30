const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

code = code.replace(
  /alert\('Det oppstod en feil under eksport \(PNG\): ' \+ \(err\.message \|\| err\)\);/g,
  `alert('Eksport feilet! Dette skjer vanligvis hvis du har limt inn en bilde-lenke (URL) fra en annen nettside som blokkerer nedlasting (CORS). LØSNING: Lagre bildet på maskinen din og bruk "Last opp"-knappen i stedet for å lime inn lenken. \\n\\nTeknisk feil: ' + (err.message || err));`
);

code = code.replace(
  /alert\('Det oppstod en feil under eksport \(ZIP\): ' \+ \(err\.message \|\| err\)\);/g,
  `alert('Eksport feilet (ZIP)! Dette skjer vanligvis hvis du har limt inn en bilde-lenke (URL) fra en nettside som blokkerer nedlasting (CORS). LØSNING: Lagre bildet på maskinen din og bruk "Last opp"-knappen. \\n\\nTeknisk feil: ' + (err.message || err));`
);

fs.writeFileSync('src/components/ExportModal.tsx', code);
