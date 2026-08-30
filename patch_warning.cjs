const fs = require('fs');
let code = fs.readFileSync('src/components/ImageUploaderModal.tsx', 'utf8');

code = code.replace(
  /<input\n\s*type="url"\n\s*placeholder="Lim inn bilde-URL her \(f\.eks\. fra en nettside\)"\n\s*value=\{urlInput\}\n\s*onChange=\{\(e\) => setUrlInput\(e\.target\.value\)\}\n\s*className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"\n\s*\/>/g,
  `<input
                  type="url"
                  placeholder="Lim inn bilde-URL her (f.eks. fra en nettside)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-amber-600 mt-1 flex items-start gap-1">
                  <strong>⚠️ Advarsel:</strong> Hvis du limer inn en URL fra en annen nettside, kan sikkerhetsregler (CORS) blokkere nedlastingen av innlegget. For best resultat, lagre bildet på maskinen din og last det opp i stedet.
                </p>`
);

fs.writeFileSync('src/components/ImageUploaderModal.tsx', code);
