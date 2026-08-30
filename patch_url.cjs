const fs = require('fs');
let code = fs.readFileSync('src/components/ImageUploaderModal.tsx', 'utf8');

const regex = /<div className="flex items-center justify-between">[\s\S]*?{isUrlMode && \([\s\S]*?}\)[\s\S]*?<\/button>\s*<\/div>\s*\)}/;

const replacement = `<div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                Last opp eget bilde, lim inn link, eller velg eksempel
              </label>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="w-4 h-4 text-stone-400" />
                </div>
                <input
                  type="text"
                  placeholder="Lim inn bilde-URL (f.eks. fra en nettside)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (urlInput.trim()) {
                    setUrl(urlInput.trim());
                    setUrlInput('');
                  }
                }}
                className="px-4 py-2 bg-stone-800 text-white text-xs font-medium rounded-lg hover:bg-stone-900 transition-colors shadow-xs"
              >
                Hent bilde
              </button>
            </div>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/ImageUploaderModal.tsx', code);
