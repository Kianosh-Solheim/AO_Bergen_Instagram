const fs = require('fs');
let code = fs.readFileSync('src/components/CanvasSlide.tsx', 'utf8');

const componentCode = `

interface InteractiveImageSlotProps {
  img: SlideImage | undefined;
  index: number;
  slide: Slide;
  placeholderLabel: string;
  customHeightClass: string;
  interactive: boolean;
  onOpenImageModal?: (image: SlideImage | undefined, index: number) => void;
  onUpdateSlide?: (updatedSlide: Slide) => void;
}

const InteractiveImageSlot: React.FC<InteractiveImageSlotProps> = ({
  img,
  index,
  slide,
  placeholderLabel,
  customHeightClass,
  interactive,
  onOpenImageModal,
  onUpdateSlide
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [posOffset, setPosOffset] = useState({ x: img?.positionX ?? 50, y: img?.positionY ?? 50 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if img changes externally
  useEffect(() => {
    if (img) {
      setPosOffset({ x: img.positionX ?? 50, y: img.positionY ?? 50 });
    }
  }, [img?.positionX, img?.positionY]);

  const hasImage = Boolean(img?.url);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive || !hasImage) return;
    if (isDragMode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault(); // Prevent text selection/image dragging
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isDragMode || !img || !containerRef.current) return;
    
    // Calculate movement in percentage of container size
    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Sensitivity based on zoom. If zoomed in, moving mouse should pan image.
    // CSS object-position works by percentage (0% to 100%).
    const percentX = (dx / rect.width) * 100;
    const percentY = (dy / rect.height) * 100;
    
    // Note: object-position moves the image. Negative % moves image left/up.
    // Wait, dragging right means object position should go left to reveal left side, 
    // actually standard drag: drag right -> image moves right -> object position % decreases.
    
    setPosOffset(prev => {
      let newX = prev.x - percentX * 0.5; // tweak sensitivity
      let newY = prev.y - percentY * 0.5;
      return { 
        x: Math.max(0, Math.min(100, newX)), 
        y: Math.max(0, Math.min(100, newY)) 
      };
    });
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    if (!isDragging || !isDragMode || !img) return;
    setIsDragging(false);
    
    // Save to slide
    if (onUpdateSlide) {
      const updatedImages = [...slide.images];
      updatedImages[index] = {
        ...img,
        positionX: posOffset.x,
        positionY: posOffset.y
      };
      onUpdateSlide({ ...slide, images: updatedImages });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive || !hasImage || !img || !isDragMode) return;
    e.preventDefault(); // stop page scroll
    e.stopPropagation();
    
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    const currentZoom = img.zoom || 1;
    const newZoom = Math.max(1, Math.min(3, currentZoom + zoomDelta));
    
    if (onUpdateSlide && newZoom !== currentZoom) {
      const updatedImages = [...slide.images];
      updatedImages[index] = {
        ...img,
        zoom: newZoom
      };
      onUpdateSlide({ ...slide, images: updatedImages });
    }
  };
  
  // Attach non-passive wheel listener manually because React synthetic wheel events are passive
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isDragMode) return;
    
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => {
      el.removeEventListener('wheel', preventScroll);
    };
  }, [isDragMode]);

  const handleClick = (e: ReactMouseEvent) => {
    if (!interactive) return;
    
    if (!hasImage) {
      if (onOpenImageModal) onOpenImageModal(undefined, index);
      return;
    }

    if (isDragMode) {
      // If we are in drag mode and dragging happened, we probably handled it in pointer events.
      // But we can allow clicking to exit drag mode maybe? 
      return;
    }
    
    // Toggle menu
    setShowMenu(!showMenu);
  };

  if (!hasImage || !img) {
    return (
      <div
        className={\`relative \${customHeightClass} min-h-[140px] rounded-sm border-2 border-dashed border-stone-300/80 hover:border-purple-400 bg-stone-100/50 hover:bg-purple-50/40 transition-all flex flex-col items-center justify-center p-4 text-center group \${
          interactive ? 'cursor-pointer' : ''
        }\`}
        onClick={handleClick}
      >
        <ImageIcon className="w-8 h-8 text-stone-300 group-hover:text-purple-400 transition-colors mb-2" />
        <span className="text-xs font-semibold text-stone-400 group-hover:text-purple-500">
          {placeholderLabel}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={\`relative \${customHeightClass} rounded-sm overflow-hidden bg-stone-200/90 shadow-xs flex flex-col group \${
        interactive && isDragMode ? 'cursor-grab active:cursor-grabbing' : interactive ? 'cursor-pointer' : ''
      }\`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      title={isDragMode ? "Dra for å flytte, scroll for å zoome" : "Klikk for meny"}
    >
      <img
        src={img.url}
        alt={img.caption || slide.title || 'Slide bilde'}
        className="w-full h-full object-cover"
        style={{
          transform: \`scale(\${img.zoom || 1})\`,
          objectPosition: \`\${posOffset.x}% \${posOffset.y}%\`,
        }}
      />
      {img.credit && (
        <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white/95 text-[9px] px-2 py-0.5 rounded font-normal z-10 pointer-events-none">
          {img.credit}
        </div>
      )}
      {img.labelTag && (
        <div className="absolute top-2.5 right-2.5 bg-stone-900/85 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded shadow-md border border-white/20 z-10 pointer-events-none">
          {img.labelTag}
        </div>
      )}
      {img.signText && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-stone-900 font-bold text-[14px] px-4 py-2 shadow-lg border border-stone-200 z-10 pointer-events-none" style={{ transform: 'translateX(-50%) rotate(-1deg)' }}>
          {img.signText}
        </div>
      )}
      
      {/* Interactive Overlay Menu */}
      {interactive && showMenu && !isDragMode && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-2 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-xl shadow-xl flex flex-col overflow-hidden w-48 text-sm">
            <div className="px-3 py-2 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
              <span className="font-bold text-stone-700 text-xs uppercase tracking-wider">Rediger bilde</span>
              <button onClick={() => setShowMenu(false)} className="text-stone-400 hover:text-stone-700">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => { setIsDragMode(true); setShowMenu(false); }}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-purple-50 text-stone-800 text-left transition-colors border-b border-stone-100"
            >
              <Move className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">Endre plassering</span>
            </button>
            <button 
              onClick={() => { if (onOpenImageModal) onOpenImageModal(img, index); setShowMenu(false); }}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-stone-50 text-stone-800 text-left transition-colors border-b border-stone-100"
            >
              <Settings className="w-4 h-4 text-stone-500" />
              <span className="font-medium">Merkelapper & Kilde</span>
            </button>
            <button 
              onClick={() => { if (onOpenImageModal) onOpenImageModal(undefined, index); setShowMenu(false); }}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-stone-50 text-stone-800 text-left transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-stone-500" />
              <span className="font-medium">Bytt bilde</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Drag Mode Indicator */}
      {interactive && isDragMode && (
        <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-20 flex items-center gap-1.5 pointer-events-none">
          <Move className="w-3.5 h-3.5" />
          Dra & Zoom
        </div>
      )}
      
      {/* Exit Drag Mode Button */}
      {interactive && isDragMode && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsDragMode(false); }}
          className="absolute top-2 right-2 bg-white text-stone-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-30 flex items-center gap-1.5 hover:bg-stone-100 border border-stone-200 cursor-pointer"
        >
          <CloseIcon className="w-3.5 h-3.5" />
          Ferdig
        </button>
      )}
    </div>
  );
};
`;

code = code + componentCode;
fs.writeFileSync('src/components/CanvasSlide.tsx', code);
