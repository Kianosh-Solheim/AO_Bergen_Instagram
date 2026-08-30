const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '          onAddSlide={(preset) => handleAddSlide(preset)}\n        />\n        </div>\n      </div>\n\n      {/* MODALS */}',
  '          onAddSlide={(preset) => handleAddSlide(preset)}\n        />\n        </div>\n\n      {/* MODALS */}'
);

// Actually, wait! Did the original code have `/>\n      </div>\n` and I changed it to `/>\n        </div>\n      </div>\n`?
// Let's just remove the first `</div>` before `</div>\n\n      {/* MODALS */}`

fs.writeFileSync('src/App.tsx', code);
