import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Slide, SlideImage, BRAND_COLORS } from '../types';
import { CanvasSlide } from './CanvasSlide';
import {
  ZoomIn,
  ZoomOut,
  Hand,
  MousePointer,
  Maximize2,
  Crosshair,
  ChevronDown,
  Info,
  X,
  Compass,
  Plus,
} from 'lucide-react';

interface CanvasWorkspaceProps {
  slide?: Slide;
  showPurpleGuide: boolean;
  showInstagramUi: boolean;
  instagramHandle?: string;
  instagramLocation?: string;
  onUpdateSlide?: (updatedSlide: Slide) => void;
  onOpenImageModal?: (image: SlideImage, index: number) => void;
  onAddSlide?: (preset?: any) => void;
  activeCanvasRef: React.RefObject<HTMLDivElement | null>;
  currentSlideIndex: number;
  totalSlides: number;
  isRecipeGuideOpen: boolean;
  setIsRecipeGuideOpen: (open: boolean) => void;
}

const ZOOM_PRESETS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '85%', value: 0.85 },
  { label: '100% (1:1)', value: 1.0 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2.0 },
];

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  slide,
  showPurpleGuide,
  showInstagramUi,
  instagramHandle,
  instagramLocation,
  onUpdateSlide,
  onOpenImageModal,
  onAddSlide,
  activeCanvasRef,
  currentSlideIndex,
  totalSlides,
  isRecipeGuideOpen,
  setIsRecipeGuideOpen,
}) => {
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [toolMode, setToolMode] = useState<'select' | 'hand'>('select');
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showPresetMenu, setShowPresetMenu] = useState<boolean>(false);
  const [showHints, setShowHints] = useState<boolean>(true);
  const [wheelMode, setWheelMode] = useState<'zoom' | 'pan'>('zoom');

  const viewportRef = useRef<HTMLDivElement>(null);
  const presetMenuRef = useRef<HTMLDivElement>(null);

  // Auto-fit to viewport
  const handleFitToScreen = useCallback(() => {
    if (!viewportRef.current) return;
    const { clientWidth, clientHeight } = viewportRef.current;
    // Canvas dimensions are 540 x 675
    const paddingX = 80;
    const paddingY = 90;
    const availableW = Math.max(200, clientWidth - paddingX);
    const availableH = Math.max(200, clientHeight - paddingY);
    const fitX = availableW / 540;
    const fitY = availableH / 675;
    const calculatedScale = Math.min(fitX, fitY);
    const clampedScale = Math.min(1.4, Math.max(0.35, calculatedScale));
    setZoomScale(Number(clampedScale.toFixed(2)));
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Reset Pan to Center
  const handleCenterCanvas = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Actual Size 100%
  const handleActualSize = useCallback(() => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Step Zoom in/out
  const handleZoomChange = (delta: number) => {
    setZoomScale((prev) => {
      const next = Math.min(2.5, Math.max(0.25, +(prev + delta).toFixed(2)));
      return next;
    });
  };

  // Fit on mount and on resize
  useEffect(() => {
    handleFitToScreen();
    window.addEventListener('resize', handleFitToScreen);
    return () => window.removeEventListener('resize', handleFitToScreen);
  }, [handleFitToScreen]);

  // Keyboard Shortcuts (Space for temporary Hand tool, +/- for Zoom, Ctrl+0 for Fit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInputActive =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isInputActive) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      } else if (e.key === 'h' || e.key === 'H') {
        setToolMode((prev) => (prev === 'hand' ? 'select' : 'hand'));
      } else if (e.key === 'v' || e.key === 'V') {
        setToolMode('select');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleFitToScreen();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        handleActualSize();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomChange(0.1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomChange(-0.1);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleFitToScreen, handleActualSize]);

  // Click outside to close preset dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (presetMenuRef.current && !presetMenuRef.current.contains(e.target as Node)) {
        setShowPresetMenu(false);
      }
    };
    if (showPresetMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPresetMenu]);

  // Wheel Zoom & Pan handler with non-passive event listener
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      const isZooming = e.ctrlKey || e.metaKey || wheelMode === 'zoom';

      if (isZooming) {
        // Zoom towards center
        const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoomScale((prev) => {
          const next = Math.min(2.5, Math.max(0.25, +(prev + zoomDelta).toFixed(2)));
          return next;
        });
      } else {
        // Pan horizontally & vertically
        setPanOffset((prev) => ({
          x: prev.x - e.deltaX * 1.1,
          y: prev.y - e.deltaY * 1.1,
        }));
      }
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', onWheel);
    };
  }, [wheelMode]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const isPanAction =
      toolMode === 'hand' ||
      isSpacePressed ||
      e.button === 1 || // Middle mouse button
      (e.target as HTMLElement).id === 'canvas-viewport' ||
      (e.target as HTMLElement).id === 'canvas-stage-wrapper';

    if (isPanAction) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Touch gesture handlers for mobile/trackpad devices
  const touchStartRef = useRef<{ dist: number; scale: number; center: { x: number; y: number } } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      touchStartRef.current = {
        dist,
        scale: zoomScale,
        center: {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        },
      };
    } else if (e.touches.length === 1 && (toolMode === 'hand' || isSpacePressed)) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const newDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      const ratio = newDist / touchStartRef.current.dist;
      const newScale = Math.min(2.5, Math.max(0.25, +(touchStartRef.current.scale * ratio).toFixed(2)));
      setZoomScale(newScale);
    } else if (e.touches.length === 1 && isDragging) {
      setPanOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    if (isDragging) {
      setIsDragging(false);
    }
  };

  // Cursor state
  const isPanActive = toolMode === 'hand' || isSpacePressed;
  const cursorClass = isDragging
    ? 'cursor-grabbing'
    : isPanActive
    ? 'cursor-grab'
    : 'cursor-default';

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-stone-200/50">
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between pointer-events-none gap-2">
        {/* Left Side: Slide indicator, Color picker & Tools */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-stone-200/80">
          <span className="text-xs font-bold text-stone-800 tracking-tight">
            {totalSlides > 0 ? `Slide ${currentSlideIndex + 1}/${totalSlides}` : 'Ingen slides'}
          </span>

          {slide && (
            <>
              <div className="h-4 w-px bg-stone-300 mx-1" />

              {/* Quick Color Swatches Right on the Canvas */}
              <div className="flex items-center gap-1.5" title="Bakgrunnsfarge for slide">
                {BRAND_COLORS.slice(0, 4).map((col) => {
                  const isSelected = slide?.bgColor?.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => onUpdateSlide && onUpdateSlide({ ...slide, bgColor: col.hex })}
                      title={`${col.name} (${col.hex})`}
                      className={`w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-stone-900 border-white scale-110 shadow-xs'
                          : 'border-stone-400/60 hover:scale-105'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-900 block" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="h-4 w-px bg-stone-300 mx-1" />

          {/* Tool Switcher: Pointer vs Hand Pan */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              onClick={() => setToolMode('select')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                toolMode === 'select'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Velg-verktøy (V) - Klikk på elementer"
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setToolMode('hand')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                toolMode === 'hand'
                  ? 'bg-white text-purple-700 shadow-xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Dra/Panorer-verktøy (H eller hold Space) - Flytt lerretet"
            >
              <Hand className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Zoom Controls & Pan Reset */}
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-stone-200/80">
          {/* Reset position button (shown when panned) */}
          {(panOffset.x !== 0 || panOffset.y !== 0) && (
            <button
              type="button"
              onClick={handleCenterCanvas}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md transition-colors cursor-pointer border border-purple-200 animate-in fade-in"
              title="Nullstill posisjon og sentrér lerretet"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Sentrér</span>
            </button>
          )}

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(-0.1)}
            disabled={zoomScale <= 0.25}
            className="p-1 hover:bg-stone-100 disabled:opacity-40 rounded text-stone-700 cursor-pointer transition-colors"
            title="Zoom ut (Ctrl -)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Percentage Dropdown Menu */}
          <div className="relative" ref={presetMenuRef}>
            <button
              type="button"
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-semibold text-stone-800 hover:bg-stone-100 rounded transition-colors cursor-pointer"
              title="Velg zoom-nivå"
            >
              <span>{Math.round(zoomScale * 100)}%</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {showPresetMenu && (
              <div className="absolute top-full mt-1 right-0 w-36 bg-white rounded-lg shadow-xl border border-stone-200 py-1.5 z-50 text-xs animate-in fade-in">
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Zoom-nivå
                </div>
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      setZoomScale(preset.value);
                      setShowPresetMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-purple-50 hover:text-purple-900 cursor-pointer ${
                      Math.abs(zoomScale - preset.value) < 0.03
                        ? 'font-bold text-purple-700 bg-purple-50/60'
                        : 'text-stone-700'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {Math.abs(zoomScale - preset.value) < 0.03 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    )}
                  </button>
                ))}
                <div className="h-px bg-stone-100 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    handleFitToScreen();
                    setShowPresetMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-purple-50 hover:text-purple-900 text-stone-700 flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-stone-400" />
                  <span>Tilpass skjerm</span>
                </button>
              </div>
            )}
          </div>

          {/* Zoom Slider */}
          <input
            type="range"
            min="25"
            max="200"
            step="5"
            value={Math.round(zoomScale * 100)}
            onChange={(e) => setZoomScale(Number(e.target.value) / 100)}
            className="w-16 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            title={`Zoom: ${Math.round(zoomScale * 100)}%`}
          />

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(0.1)}
            disabled={zoomScale >= 2.5}
            className="p-1 hover:bg-stone-100 disabled:opacity-40 rounded text-stone-700 cursor-pointer transition-colors"
            title="Zoom inn (Ctrl +)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-stone-300 mx-0.5" />

          {/* Fit to Screen Button */}
          <button
            type="button"
            onClick={handleFitToScreen}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors cursor-pointer"
            title="Tilpass lerretet til vinduet (Ctrl + 0)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
            <span>Tilpass</span>
          </button>
        </div>
      </div>

      {/* Quick Recipe Rules Popup (if toggled) */}
      {isRecipeGuideOpen && (
        <div className="absolute top-16 left-4 z-40 max-w-sm bg-white p-4 rounded-xl shadow-xl border border-stone-200 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
            <span className="font-bold text-stone-900">
              Oppskrift: Innlegg til Instagram
            </span>
            <button
              onClick={() => setIsRecipeGuideOpen(false)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-1.5 text-stone-600 list-disc pl-4 leading-relaxed">
            <li>
              <strong>1080 x 1350</strong> (4:5 format for Instagram feed).
            </li>
            <li>
              <strong>3 bakgrunnsfarger:</strong> Lysegul (<code className="text-amber-700">#fff3d1</code>), Lysegrønn (<code className="text-emerald-700">#e2f6e5</code>), Lyselilla (<code className="text-indigo-700">#ebe4f7</code>).
            </li>
            <li>
              <strong>Font:</strong> «Agrandir» (eller «Comic Sans» for tull & tøys).
            </li>
            <li>
              <strong>Lilla ramme:</strong> Plasser overskrift og bilde innenfor den lilla sikkerhetssonen.
            </li>
            <li>
              <strong>Avstand:</strong> Pass på at avstanden mellom overskrift og bilde ikke er for stor.
            </li>
          </ul>
        </div>
      )}

      {/* Main Interactive Canvas Viewport with Subtle Dot Pattern */}
      <div
        id="canvas-viewport"
        ref={viewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`flex-1 w-full h-full relative overflow-hidden flex items-center justify-center ${cursorClass} select-none touch-none`}
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
        }}
      >
        {/* Stage Wrapper for Smooth Translation & Pan */}
        <div
          id="canvas-stage-wrapper"
          className="relative flex items-center justify-center"
          style={{
            transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            willChange: 'transform',
          }}
        >
          {/* If Pan mode or Space is pressed, overlay a protective dragging layer to prevent text/image selection */}
          {isPanActive && (
            <div className="absolute inset-0 z-40 bg-transparent cursor-grab active:cursor-grabbing" />
          )}

          {slide ? (
            <CanvasSlide
              slide={slide}
              showPurpleGuide={showPurpleGuide}
              showInstagramUi={showInstagramUi}
              instagramHandle={instagramHandle}
              instagramLocation={instagramLocation}
              scale={zoomScale}
              onUpdateSlide={onUpdateSlide}
              onOpenImageModal={onOpenImageModal}
              canvasRef={activeCanvasRef}
              interactive={!isPanActive}
            />
          ) : (
            <div
              className="relative select-none origin-center flex-shrink-0 bg-white shadow-2xl rounded-sm flex flex-col items-center justify-center p-8 text-center border border-stone-300"
              style={{
                width: '540px',
                height: '675px',
                transform: `scale(${zoomScale})`,
              }}
            >
              <div className="max-w-md space-y-4">
                <div className="w-16 h-16 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Ingen slide i karusellen
                  </h3>
                  <p className="text-sm text-stone-600 mt-1">
                    Start med et tomt lerret eller velg en oppskriftsmal nedenfor for å begynne:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left pt-2">
                  <button
                    type="button"
                    onClick={() => onAddSlide && onAddSlide('hook')}
                    className="p-3 bg-stone-50 hover:bg-purple-50 border border-stone-200 hover:border-purple-300 rounded-xl transition-all text-xs font-semibold text-stone-800 flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-purple-700 font-bold">Overskrift + Bilde</span>
                    <span className="text-[11px] text-stone-500 font-normal">Klassisk hook-forside</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddSlide && onAddSlide('fra_til')}
                    className="p-3 bg-stone-50 hover:bg-purple-50 border border-stone-200 hover:border-purple-300 rounded-xl transition-all text-xs font-semibold text-stone-800 flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-purple-700 font-bold">Fra dette ➡️ Til dette</span>
                    <span className="text-[11px] text-stone-500 font-normal">Før & etter-sammenligning</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddSlide && onAddSlide('flerbilde')}
                    className="p-3 bg-stone-50 hover:bg-purple-50 border border-stone-200 hover:border-purple-300 rounded-xl transition-all text-xs font-semibold text-stone-800 flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-purple-700 font-bold">Flerbilde-layout</span>
                    <span className="text-[11px] text-stone-500 font-normal">Flere bilder i én slide</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddSlide && onAddSlide('sitat')}
                    className="p-3 bg-stone-50 hover:bg-purple-50 border border-stone-200 hover:border-purple-300 rounded-xl transition-all text-xs font-semibold text-stone-800 flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-purple-700 font-bold">Sitat & Tekstslide</span>
                    <span className="text-[11px] text-stone-500 font-normal">Med ikon og uthevet tekst</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Floating Navigation Hints / Shortcut Helper */}
      {showHints && (
        <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 bg-stone-900/80 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-lg shadow-lg border border-white/10 animate-in fade-in">
          <Compass className="w-3.5 h-3.5 text-purple-300" />
          <span>
            <strong>Hold mellomrom</strong> eller velg <Hand className="w-3 h-3 inline text-purple-300 mx-0.5" /> for å dra • <strong>Rullehjul</strong> for å zoome
          </span>
          <button
            onClick={() => setShowHints(false)}
            className="text-stone-400 hover:text-white ml-2 p-0.5 rounded cursor-pointer"
            title="Lukk tips"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
