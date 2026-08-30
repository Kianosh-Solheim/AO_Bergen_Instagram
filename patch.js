const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '          />\n          {/* Bottom Carousel Management Strip */}',
  `          />\n          {/* Mobile Open Editor Button */}\n          <button\n            onClick={() => setIsMobileEditorOpen(true)}\n            className="lg:hidden absolute bottom-[88px] right-4 z-20 bg-stone-900 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm border-2 border-white/20"\n          >\n            <Edit2 className="w-4 h-4" />\n            <span>Rediger</span>\n          </button>\n\n          {/* Bottom Carousel Management Strip */}`
);

code = code.replace(
  '          />\n        </div>\n        {/* Right Editor Controls Sidebar */}\n        <EditorSidebar',
  `          />\n        </div>\n\n        {/* Mobile Overlay */}\n        {isMobileEditorOpen && (\n          <div \n            className="lg:hidden fixed inset-0 bg-stone-900/60 z-30 backdrop-blur-sm"\n            onClick={() => setIsMobileEditorOpen(false)}\n          />\n        )}\n\n        {/* Right Editor Controls Sidebar */}\n        <div className={\`\n          absolute lg:relative z-40 lg:z-auto\n          top-0 right-0 bottom-0 \n          w-[90%] max-w-[400px] lg:w-auto lg:max-w-none\n          transform transition-transform duration-300 ease-in-out\n          \${isMobileEditorOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}\n          bg-white shadow-2xl lg:shadow-none flex flex-col\n        \`}>\n          {/* Mobile Close Button */}\n          <button \n            onClick={() => setIsMobileEditorOpen(false)}\n            className="lg:hidden absolute top-4 -left-12 bg-white p-2 rounded-l-xl shadow-lg border-y border-l border-stone-200"\n          >\n            <X className="w-6 h-6 text-stone-600" />\n          </button>\n\n          <EditorSidebar`
);

code = code.replace(
  '            setEditingImage({ image, index })\n          }\n          onAddSlide={(preset) => handleAddSlide(preset)}\n        />\n      </div>\n',
  '            setEditingImage({ image, index })\n          }\n          onAddSlide={(preset) => handleAddSlide(preset)}\n        />\n        </div>\n      </div>\n'
);

fs.writeFileSync('src/App.tsx', code);
