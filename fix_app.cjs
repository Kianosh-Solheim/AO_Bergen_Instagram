const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf-8');
file = file.replace("import { LogOut, Save, Library } from 'lucide-react';\n", "");
fs.writeFileSync('src/App.tsx', file);
