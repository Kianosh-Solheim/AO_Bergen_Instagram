const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
console.log(code.split('\n').map((l, i) => `${i+1}: ${l}`).join('\n'));
