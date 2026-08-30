const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

// Replace the error handling to format [object Event] better
code = code.replace(/alert\('Eksport feilet \(ZIP\)!.*?\\n\\nTeknisk feil: ' \+ \(err\.message \|\| err\)\);/g, 
`
      let errMsg = err.message || err;
      if (err instanceof Event) {
        errMsg = "CORS-blokkering eller nettverksfeil ved nedlasting av bilde (Event)";
      } else if (typeof err === 'object' && err.type === 'error') {
        errMsg = "Nettleseren blokkerte bildet. Prøv 'Last opp' knappen i stedet.";
      }
      
      alert('Eksport feilet (ZIP)!\\n\\nDette skjer fordi du har limt inn en lenke til et bilde (URL) som er beskyttet mot nedlasting.\\n\\n💯 LØSNING: For at det alltid skal fungere 100%, må du høyreklikke på bildet på nettsiden, velge "Lagre bilde som...", og så bruke "Last opp"-knappen her inne!\\n\\nTeknisk feil: ' + errMsg);
`);

code = code.replace(/alert\('Eksport feilet \(PNG\)!.*?\\n\\nTeknisk feil: ' \+ \(err\.message \|\| err\)\);/g, 
`
      let errMsg = err.message || err;
      if (err instanceof Event) {
        errMsg = "CORS-blokkering eller nettverksfeil ved nedlasting av bilde (Event)";
      } else if (typeof err === 'object' && err.type === 'error') {
        errMsg = "Nettleseren blokkerte bildet. Prøv 'Last opp' knappen i stedet.";
      }
      
      alert('Eksport feilet (PNG)!\\n\\nDette skjer fordi du har limt inn en lenke til et bilde (URL) som er beskyttet mot nedlasting.\\n\\n💯 LØSNING: For at det alltid skal fungere 100%, må du høyreklikke på bildet på nettsiden, velge "Lagre bilde som...", og så bruke "Last opp"-knappen her inne!\\n\\nTeknisk feil: ' + errMsg);
`);

fs.writeFileSync('src/components/ExportModal.tsx', code);
