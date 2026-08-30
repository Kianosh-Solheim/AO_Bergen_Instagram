const fs = require('fs');
let code = fs.readFileSync('src/components/ImageUploaderModal.tsx', 'utf8');

// Add signText state
code = code.replace(
  "const [labelTag, setLabelTag] = useState(image.labelTag || '');",
  "const [labelTag, setLabelTag] = useState(image.labelTag || '');\n  const [signText, setSignText] = useState(image.signText || '');"
);

// Add isDragging state
code = code.replace(
  "const fileInputRef = useRef<HTMLInputElement>(null);",
  "const fileInputRef = useRef<HTMLInputElement>(null);\n  const [isDragging, setIsDragging] = useState(false);\n  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });\n\n  // Handle dragging to pan image\n  const handleMouseDown = (e: React.MouseEvent) => {\n    e.preventDefault();\n    setIsDragging(true);\n    setDragStart({ x: e.clientX, y: e.clientY });\n  };\n\n  React.useEffect(() => {\n    const handleMouseMove = (e: MouseEvent) => {\n      if (!isDragging) return;\n      const deltaX = e.clientX - dragStart.x;\n      const deltaY = e.clientY - dragStart.y;\n      const sensitivity = 0.3 / zoom;\n      setPositionX(prev => Math.max(0, Math.min(100, prev - deltaX * sensitivity)));\n      setPositionY(prev => Math.max(0, Math.min(100, prev - deltaY * sensitivity)));\n      setDragStart({ x: e.clientX, y: e.clientY });\n    };\n    const handleMouseUp = () => setIsDragging(false);\n    \n    if (isDragging) {\n      window.addEventListener('mousemove', handleMouseMove);\n      window.addEventListener('mouseup', handleMouseUp);\n    }\n    return () => {\n      window.removeEventListener('mousemove', handleMouseMove);\n      window.removeEventListener('mouseup', handleMouseUp);\n    };\n  }, [isDragging, dragStart, zoom]);\n\n  // Handle wheel to zoom\n  const handleWheel = (e: React.WheelEvent) => {\n    e.preventDefault();\n    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;\n    setZoom(prev => Math.max(1, Math.min(3, prev + zoomDelta)));\n  };\n"
);

// Add mouse and wheel events to image container
code = code.replace(
  '<div className="relative w-full h-56 bg-stone-200 rounded-lg overflow-hidden border border-stone-300 shadow-inner flex items-center justify-center">',
  '<div className="relative w-full h-56 bg-stone-200 rounded-lg overflow-hidden border border-stone-300 shadow-inner flex items-center justify-center cursor-move" onMouseDown={handleMouseDown} onWheel={handleWheel}>'
);

// Add signText to handleSave
code = code.replace(
  "labelTag,\n    });",
  "labelTag,\n      signText,\n    });"
);

// Add signText input field
code = code.replace(
  "{/* Meme Label Tag (Optional) */}",
  `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Skilt under bildet (ny funksjon)
              </label>
              <input
                type="text"
                placeholder="F.eks. «Planlagt revet»"
                value={signText}
                onChange={(e) => setSignText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Valgfri merkelapp i hjørnet (meme)
              </label>
              <input
                type="text"
                placeholder="F.eks. «Gru sitt hus»"
                value={labelTag}
                onChange={(e) => setLabelTag(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>`
);

// Remove the old meme label input since we replaced it
code = code.replace(
  /<div>\s*<label className="block text-xs font-semibold text-stone-600 mb-1">\s*Valgfri merkelapp \/ Meme-tag \(vises i hjørnet av bildet\)\s*<\/label>\s*<input\s*type="text"\s*placeholder="F\.eks\. «Gru sitt hus \| Despicable me» eller «Møllendalsveien 1C»"\s*value={labelTag}\s*onChange={\(e\) => setLabelTag\(e\.target\.value\)}\s*className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"\s*\/>\s*<\/div>/,
  ""
);

fs.writeFileSync('src/components/ImageUploaderModal.tsx', code);
