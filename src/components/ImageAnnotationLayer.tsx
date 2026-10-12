import React, { useState, useRef, useEffect } from 'react';
import { ImageAnnotation } from '../types';
import { Trash2, Plus, ArrowUpRight, Square, Circle as CircleIcon, Tag } from 'lucide-react';

interface ImageAnnotationLayerProps {
  annotations: ImageAnnotation[];
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onUpdateAnnotation?: (updated: ImageAnnotation) => void;
}

export const ANNOTATION_COLORS = [
  { name: 'Rød (Rives / Fare)', hex: '#ef4444', textCol: '#ffffff' },
  { name: 'Gul (Fokus / Obs)', hex: '#facc15', textCol: '#1c1917' },
  { name: 'Grønn (Bevares / Nytt)', hex: '#22c55e', textCol: '#ffffff' },
  { name: 'Blå (Plan / Område)', hex: '#3b82f6', textCol: '#ffffff' },
  { name: 'Lilla (AO-farge)', hex: '#9333ea', textCol: '#ffffff' },
  { name: 'Hvit', hex: '#ffffff', textCol: '#1c1917' },
  { name: 'Sort', hex: '#1c1917', textCol: '#ffffff' },
];

export const QUICK_ANNOTATION_PRESETS: Array<{
  title: string;
  subtitle: string;
  create: () => ImageAnnotation;
}> = [
  {
    title: 'Pil: «Her rives det»',
    subtitle: 'Rød pil med tekstboks',
    create: () => ({
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'arrow',
      color: '#ef4444',
      label: 'Her rives det!',
      strokeWidth: 3.5,
      x1: 22,
      y1: 22,
      x2: 52,
      y2: 52,
    }),
  },
  {
    title: 'Pil: «Her skal det bygges»',
    subtitle: 'Gul pil med tekstboks',
    create: () => ({
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'arrow',
      color: '#facc15',
      label: 'Her skal det bygges',
      strokeWidth: 3.5,
      x1: 78,
      y1: 22,
      x2: 52,
      y2: 55,
    }),
  },
  {
    title: 'Boks: Marker bygg / tomt',
    subtitle: 'Stiplet boks rundt område',
    create: () => ({
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'box',
      color: '#ef4444',
      label: 'Planlagt revet',
      strokeWidth: 3,
      dashed: true,
      filled: true,
      x: 50,
      y: 55,
      width: 42,
      height: 36,
    }),
  },
  {
    title: 'Sirkel: Fokusområde',
    subtitle: 'Marker detalj eller bygg',
    create: () => ({
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'circle',
      color: '#facc15',
      label: 'Se her!',
      strokeWidth: 3,
      dashed: false,
      filled: false,
      x: 50,
      y: 50,
      width: 34,
      height: 34,
    }),
  },
  {
    title: 'Tekstskilt / Punkt',
    subtitle: 'Frittstående merkelapp på bildet',
    create: () => ({
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'label',
      color: '#1c1917',
      label: 'Ny høyblokk (8 etg.)',
      x: 50,
      y: 30,
    }),
  },
];

export const getContrastText = (hex: string): string => {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 165 ? '#1c1917' : '#ffffff';
  }
  return '#ffffff';
};

export const ImageAnnotationLayer: React.FC<ImageAnnotationLayerProps> = ({
  annotations,
  interactive = false,
  selectedId = null,
  onSelect,
  onUpdateAnnotation,
}) => {
  const layerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    id: string;
    mode: 'move' | 'start' | 'end' | 'resize';
    startMouseX: number;
    startMouseY: number;
    initialAnn: ImageAnnotation;
  } | null>(null);

  useEffect(() => {
    if (!dragState || !interactive || !onUpdateAnnotation) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!layerRef.current) return;
      const rect = layerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dxPct = ((e.clientX - dragState.startMouseX) / rect.width) * 100;
      const dyPct = ((e.clientY - dragState.startMouseY) / rect.height) * 100;
      const clamp = (val: number, min = 2, max = 98) => Math.max(min, Math.min(max, Math.round(val * 10) / 10));

      const ann = dragState.initialAnn;

      if (ann.type === 'arrow') {
        const x1 = ann.x1 ?? 25;
        const y1 = ann.y1 ?? 25;
        const x2 = ann.x2 ?? 60;
        const y2 = ann.y2 ?? 60;

        if (dragState.mode === 'start') {
          onUpdateAnnotation({
            ...ann,
            x1: clamp(x1 + dxPct),
            y1: clamp(y1 + dyPct),
          });
        } else if (dragState.mode === 'end') {
          onUpdateAnnotation({
            ...ann,
            x2: clamp(x2 + dxPct),
            y2: clamp(y2 + dyPct),
          });
        } else if (dragState.mode === 'move') {
          onUpdateAnnotation({
            ...ann,
            x1: clamp(x1 + dxPct),
            y1: clamp(y1 + dyPct),
            x2: clamp(x2 + dxPct),
            y2: clamp(y2 + dyPct),
          });
        }
      } else {
        const x = ann.x ?? 50;
        const y = ann.y ?? 50;
        const width = ann.width ?? 35;
        const height = ann.height ?? 30;

        if (dragState.mode === 'move') {
          onUpdateAnnotation({
            ...ann,
            x: clamp(x + dxPct, 5, 95),
            y: clamp(y + dyPct, 5, 95),
          });
        } else if (dragState.mode === 'resize') {
          onUpdateAnnotation({
            ...ann,
            width: clamp(width + dxPct * 2, 8, 95),
            height: clamp(height + dyPct * 2, 8, 95),
          });
        }
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, interactive, onUpdateAnnotation]);

  if (!annotations || annotations.length === 0) return null;

  const startDrag = (
    e: React.PointerEvent,
    ann: ImageAnnotation,
    mode: 'move' | 'start' | 'end' | 'resize'
  ) => {
    if (!interactive) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect?.(ann.id);
    setDragState({
      id: ann.id,
      mode,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      initialAnn: { ...ann },
    });
  };

  return (
    <div
      ref={layerRef}
      className={`absolute inset-0 z-15 overflow-hidden select-none ${
        interactive ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      onClick={(e) => {
        if (interactive && e.target === layerRef.current) {
          onSelect?.(null);
        }
      }}
    >
      {/* SVG Layer for Arrows */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
      >
        {annotations
          .filter((a) => a.type === 'arrow')
          .map((ann) => {
            const x1 = ann.x1 ?? 25;
            const y1 = ann.y1 ?? 25;
            const x2 = ann.x2 ?? 60;
            const y2 = ann.y2 ?? 60;
            const strokeW = ann.strokeWidth ?? 3.2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const angle = Math.atan2(dy, dx);
            const headLen = Math.max(4.5, strokeW * 1.45);
            const headAngle = Math.PI / 6.2;

            const hx1 = x2 - headLen * Math.cos(angle - headAngle);
            const hy1 = y2 - headLen * Math.sin(angle - headAngle);
            const hx2 = x2 - headLen * Math.cos(angle + headAngle);
            const hy2 = y2 - headLen * Math.sin(angle + headAngle);

            // Shorten line slightly so it doesn't poke through sharp tip
            const lineEndX = x2 - headLen * 0.55 * Math.cos(angle);
            const lineEndY = y2 - headLen * 0.55 * Math.sin(angle);

            return (
              <g key={ann.id} className="pointer-events-none">
                {/* Dark outline for visibility on any photo */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={lineEndX}
                  y2={lineEndY}
                  stroke="rgba(0,0,0,0.65)"
                  strokeWidth={strokeW + 1.6}
                  strokeLinecap="round"
                  strokeDasharray={ann.dashed ? '3.5 2.5' : undefined}
                />
                <polygon
                  points={`${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}`}
                  fill="rgba(0,0,0,0.65)"
                  stroke="rgba(0,0,0,0.65)"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />

                {/* Main colored arrow */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={lineEndX}
                  y2={lineEndY}
                  stroke={ann.color || '#ef4444'}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  strokeDasharray={ann.dashed ? '3.5 2.5' : undefined}
                />
                <polygon
                  points={`${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}`}
                  fill={ann.color || '#ef4444'}
                  stroke={ann.color || '#ef4444'}
                  strokeWidth="0.6"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
      </svg>

      {/* HTML Overlay for Arrow Labels & Interactive Handles, plus Boxes, Circles, and Labels */}
      {annotations.map((ann) => {
        const isSelected = interactive && selectedId === ann.id;
        const color = ann.color || '#ef4444';
        const textColor = getContrastText(color);

        if (ann.type === 'arrow') {
          const x1 = ann.x1 ?? 25;
          const y1 = ann.y1 ?? 25;
          const x2 = ann.x2 ?? 60;
          const y2 = ann.y2 ?? 60;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <React.Fragment key={ann.id}>
              {/* Optional label near start of arrow */}
              {ann.label && (
                <div
                  style={{
                    left: `${x1}%`,
                    top: `${y1}%`,
                    transform: 'translate(-50%, -125%)',
                    backgroundColor: color,
                    color: textColor,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                  }}
                  onPointerDown={(e) => startDrag(e, ann, 'move')}
                  className={`absolute px-2 py-0.5 rounded-md font-extrabold text-[11px] leading-tight whitespace-nowrap z-20 ${
                    interactive ? 'cursor-move' : 'pointer-events-none'
                  }`}
                >
                  {ann.label}
                </div>
              )}

              {/* Interactive handles for arrow */}
              {interactive && (
                <>
                  {/* Center move handle */}
                  <div
                    style={{ left: `${midX}%`, top: `${midY}%` }}
                    onPointerDown={(e) => startDrag(e, ann, 'move')}
                    title="Dra for å flytte hele pilen"
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-stone-900/80 text-white border-2 border-white shadow-md flex items-center justify-center cursor-move z-30 transition-transform ${
                      isSelected ? 'scale-110 ring-2 ring-purple-500' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[8px] font-bold">✥</span>
                  </div>

                  {/* Start tail handle */}
                  <div
                    style={{ left: `${x1}%`, top: `${y1}%` }}
                    onPointerDown={(e) => startDrag(e, ann, 'start')}
                    title="Dra for å flytte starten på pilen"
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-stone-900 shadow-md cursor-grab active:cursor-grabbing z-30 ${
                      isSelected ? 'ring-2 ring-purple-500 scale-110' : ' opacity-85 hover:opacity-100'
                    }`}
                  />

                  {/* Arrowhead tip handle */}
                  <div
                    style={{ left: `${x2}%`, top: `${y2}%` }}
                    onPointerDown={(e) => startDrag(e, ann, 'end')}
                    title="Dra for å peke pilspissen dit du vil"
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-4.5 h-4.5 rounded-full border-2 border-white shadow-md cursor-grab active:cursor-grabbing z-30 ${
                      isSelected ? 'ring-2 ring-purple-500 scale-115' : 'opacity-90 hover:opacity-100'
                    }`}
                    style-color={color}
                  >
                    <div
                      className="w-full h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </>
              )}
            </React.Fragment>
          );
        }

        if (ann.type === 'box' || ann.type === 'circle') {
          const x = ann.x ?? 50;
          const y = ann.y ?? 50;
          const width = ann.width ?? 35;
          const height = ann.height ?? 30;
          const strokePx = Math.max(2, Math.round(ann.strokeWidth ?? 3));

          return (
            <div
              key={ann.id}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${width}%`,
                height: `${height}%`,
                transform: 'translate(-50%, -50%)',
                borderColor: color,
                borderWidth: `${strokePx}px`,
                borderStyle: ann.dashed ? 'dashed' : 'solid',
                backgroundColor: ann.filled ? `${color}28` : 'transparent',
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.45))',
              }}
              onPointerDown={(e) => startDrag(e, ann, 'move')}
              className={`absolute ${
                ann.type === 'circle' ? 'rounded-full' : 'rounded-md'
              } ${interactive ? 'cursor-move' : 'pointer-events-none'} ${
                isSelected ? 'ring-2 ring-white' : ''
              }`}
            >
              {ann.label && (
                <div
                  style={{
                    backgroundColor: color,
                    color: textColor,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                  }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded font-extrabold text-[10px] leading-tight whitespace-nowrap pointer-events-none"
                >
                  {ann.label}
                </div>
              )}

              {/* Bottom-right resize handle when interactive */}
              {interactive && (
                <div
                  onPointerDown={(e) => startDrag(e, ann, 'resize')}
                  title="Dra for å endre størrelse på boksen/sirkelen"
                  className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-white border-2 border-stone-900 shadow-md cursor-nwse-resize z-30 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 bg-stone-900 rounded-full" />
                </div>
              )}
            </div>
          );
        }

        // 'label' badge annotation
        const x = ann.x ?? 50;
        const y = ann.y ?? 50;
        return (
          <div
            key={ann.id}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: color,
              color: textColor,
              boxShadow: '0 3px 8px rgba(0,0,0,0.38)',
            }}
            onPointerDown={(e) => startDrag(e, ann, 'move')}
            className={`absolute px-2.5 py-1 rounded-md font-extrabold text-[11px] leading-tight whitespace-nowrap z-20 ${
              interactive ? 'cursor-move' : 'pointer-events-none'
            } ${isSelected ? 'ring-2 ring-purple-500 scale-105' : ''}`}
          >
            {ann.label || 'Merkelapp'}
          </div>
        );
      })}
    </div>
  );
};

interface AnnotationEditorControlsProps {
  annotations: ImageAnnotation[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (updated: ImageAnnotation[]) => void;
}

export const AnnotationEditorControls: React.FC<AnnotationEditorControlsProps> = ({
  annotations,
  selectedId,
  onSelect,
  onChange,
}) => {
  const selectedAnn = annotations.find((a) => a.id === selectedId) || annotations[annotations.length - 1] || null;

  const addAnnotation = (ann: ImageAnnotation) => {
    const next = [...annotations, ann];
    onChange(next);
    onSelect(ann.id);
  };

  const handleAddType = (type: ImageAnnotation['type']) => {
    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (type === 'arrow') {
      addAnnotation({
        id,
        type: 'arrow',
        color: '#ef4444',
        label: 'Her!',
        strokeWidth: 3.5,
        x1: 25,
        y1: 25,
        x2: 55,
        y2: 55,
      });
    } else if (type === 'box') {
      addAnnotation({
        id,
        type: 'box',
        color: '#ef4444',
        label: 'Rives / Bygges',
        strokeWidth: 3,
        dashed: true,
        filled: true,
        x: 50,
        y: 50,
        width: 40,
        height: 32,
      });
    } else if (type === 'circle') {
      addAnnotation({
        id,
        type: 'circle',
        color: '#facc15',
        label: '',
        strokeWidth: 3,
        dashed: false,
        filled: false,
        x: 50,
        y: 50,
        width: 32,
        height: 32,
      });
    } else {
      addAnnotation({
        id,
        type: 'label',
        color: '#1c1917',
        label: 'Her skal det bygges',
        x: 50,
        y: 35,
      });
    }
  };

  const updateSelected = (patch: Partial<ImageAnnotation>) => {
    if (!selectedAnn) return;
    onChange(
      annotations.map((a) => (a.id === selectedAnn.id ? { ...a, ...patch } : a))
    );
  };

  const removeAnnotation = (id: string) => {
    const next = annotations.filter((a) => a.id !== id);
    onChange(next);
    if (selectedId === id) {
      onSelect(next[next.length - 1]?.id || null);
    }
  };

  return (
    <div className="space-y-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-red-600" />
            Piler, Bokser & Markeringer på bildet ({annotations.length})
          </label>
          <p className="text-[11px] text-stone-500">
            Pek på hva som skal rives, bygges eller endres. Dra punktene direkte på bildet for å flytte!
          </p>
        </div>
        {annotations.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange([]);
              onSelect(null);
            }}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
          >
            Fjern alle
          </button>
        )}
      </div>

      {/* Add Shape Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleAddType('arrow')}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white hover:bg-red-50 border border-stone-300 hover:border-red-400 rounded-lg text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowUpRight className="w-4 h-4 text-red-600" />
          <span>+ Legg til Pil</span>
        </button>
        <button
          type="button"
          onClick={() => handleAddType('box')}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white hover:bg-amber-50 border border-stone-300 hover:border-amber-400 rounded-lg text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 text-amber-600" />
          <span>+ Legg til Boks</span>
        </button>
        <button
          type="button"
          onClick={() => handleAddType('circle')}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white hover:bg-purple-50 border border-stone-300 hover:border-purple-400 rounded-lg text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
        >
          <CircleIcon className="w-3.5 h-3.5 text-purple-600" />
          <span>+ Sirkel / Ring</span>
        </button>
        <button
          type="button"
          onClick={() => handleAddType('label')}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white hover:bg-stone-100 border border-stone-300 hover:border-stone-400 rounded-lg text-xs font-bold text-stone-800 shadow-2xs transition-all cursor-pointer"
        >
          <Tag className="w-3.5 h-3.5 text-stone-700" />
          <span>+ Tekstskilt</span>
        </button>
      </div>

      {/* Quick Presets for "Rives / Bygges" */}
      <div className="space-y-1">
        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
          Hurtigvalg (1 klikk):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ANNOTATION_PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => addAnnotation(preset.create())}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white hover:bg-purple-50 text-stone-700 hover:text-purple-900 border border-stone-200 hover:border-purple-300 transition-colors cursor-pointer"
              title={preset.subtitle}
            >
              + {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* List of active annotations & editor for selected */}
      {annotations.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-stone-200">
          {/* Pill selector if multiple */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {annotations.map((ann, idx) => {
              const isSel = selectedAnn?.id === ann.id;
              const typeLabel =
                ann.type === 'arrow'
                  ? 'Pil'
                  : ann.type === 'box'
                  ? 'Boks'
                  : ann.type === 'circle'
                  ? 'Sirkel'
                  : 'Skilt';
              return (
                <div
                  key={ann.id}
                  onClick={() => onSelect(ann.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                    isSel
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/50 flex-shrink-0"
                    style={{ backgroundColor: ann.color }}
                  />
                  <span>
                    #{idx + 1} {typeLabel}
                    {ann.label ? `: «${ann.label.slice(0, 12)}»` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAnnotation(ann.id);
                    }}
                    className="ml-1 opacity-75 hover:opacity-100 text-red-400 hover:text-red-500"
                    title="Slett markering"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Selected Annotation Controls */}
          {selectedAnn && (
            <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Tekst på markering (valgfritt)
                  </label>
                  <input
                    type="text"
                    placeholder="F.eks. «Rives», «Ny blokk», «Bevares»..."
                    value={selectedAnn.label || ''}
                    onChange={(e) => updateSelected({ label: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Farge
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ANNOTATION_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => updateSelected({ color: c.hex })}
                        title={c.name}
                        className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                          selectedAnn.color.toLowerCase() === c.hex.toLowerCase()
                            ? 'scale-115 ring-2 ring-stone-900 border-white'
                            : 'border-stone-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {selectedAnn.type !== 'label' && (
                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                    <span className="text-[11px] font-semibold text-stone-600">
                      Tykkelse:
                    </span>
                    <input
                      type="range"
                      min="1.5"
                      max="6"
                      step="0.5"
                      value={selectedAnn.strokeWidth ?? 3}
                      onChange={(e) =>
                        updateSelected({ strokeWidth: parseFloat(e.target.value) })
                      }
                      className="flex-1 accent-stone-900 cursor-pointer"
                    />
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedAnn.dashed)}
                      onChange={(e) => updateSelected({ dashed: e.target.checked })}
                      className="rounded accent-purple-600"
                    />
                    <span>Stiplet linje</span>
                  </label>

                  {(selectedAnn.type === 'box' || selectedAnn.type === 'circle') && (
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedAnn.filled)}
                        onChange={(e) => updateSelected({ filled: e.target.checked })}
                        className="rounded accent-purple-600"
                      />
                      <span>Farget fyll inni</span>
                    </label>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
