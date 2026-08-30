const fs = require('fs');
let code = fs.readFileSync('src/components/ExportModal.tsx', 'utf8');

// I will just let the user fix ZIP if they want, my main job is to fix the crash.
// But fixing ZIP is easy. 
