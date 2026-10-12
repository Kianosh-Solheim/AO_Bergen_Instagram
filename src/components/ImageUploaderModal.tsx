import React, { useState, useRef } from 'react';
import { SlideImage, ImageAnnotation } from '../types';
import { SAMPLE_IMAGES } from '../data/defaultPresets';
import { compressImageFile, compressDataUrlIfNeeded } from '../lib/imageUtils';
import { ImageAnnotationLayer, AnnotationEditorControls } from './ImageAnnotationLayer';
import { Upload, Image as ImageIcon, ZoomIn, Move, X, Check, Link, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

interface ImageUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: SlideImage | null;
  onSave: (updatedImage: SlideImage) => void;
  onDelete?: () => void;
  title?: string;
}

export const ImageUploaderModal: React.FC<ImageUploaderModalProps> = ({
  isOpen,
  onClose,
  image,
  onSave,
  onDelete,
  title = 'Rediger bilde',
}) => {
  if (!isOpen || !image) return null;

  const [url, setUrl] = useState(image.url);
  const [credit, setCredit] = useState(image.credit || '');
  const [caption, setCaption] = useState(image.caption || '');
  const [zoom, setZoom] = useState(image.zoom || 1);
  const [positionY, setPositionY] = useState(image.positionY ?? 50);
  const [positionX, setPositionX] = useState(image.positionX ?? 50);
  const [labelTag, setLabelTag] = useState(image.labelTag || '');
  const [signText, setSignText] = useState(image.signText || '');
  const [annotations, setAnnotations] = useState<ImageAnnotation[]>(image.annotations || []);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(
    image.annotations?.[0]?.id || null
  );
  const [urlInput, setUrlInput] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isFileDropOver, setIsFileDropOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const processComputerFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsProcessingFile(true);
    try {
      const optimizedDataUrl = await compressImageFile(file);
      setUrl(optimizedDataUrl);
      setUploadedFileName(file.name);
    } catch (err) {
      console.error('Feil ved bildeopplasting:', err);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Support Ctrl+V / Cmd+V image paste while modal is open
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processComputerFile(blob);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Handle dragging to pan image
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const sensitivity = 0.3 / zoom;
      setPositionX(prev => Math.max(0, Math.min(100, prev - deltaX * sensitivity)));
      setPositionY(prev => Math.max(0, Math.min(100, prev - deltaY * sensitivity)));
      setDragStart({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, zoom]);

  // Handle wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(1, Math.min(3, prev + zoomDelta)));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processComputerFile(file);
      e.target.value = '';
    }
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFileDropOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processComputerFile(file);
    }
  };

  const handleSave = async () => {
    setIsProcessingFile(true);
    try {
      const optimizedUrl =
        url && url.startsWith('data:image/') && url.length > 220_000
          ? await compressDataUrlIfNeeded(url)
          : url;
      onSave({
        ...image,
        url: optimizedUrl,
        credit,
        caption,
        zoom,
        positionY,
        positionX,
        labelTag,
        signText,
        annotations,
      });
      onClose();
    } finally {
      setIsProcessingFile(false);
    }
  };

  const isLocalUploadedImage = Boolean(url && url.startsWith('data:image/'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-lg">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Image Live Crop Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                Forhåndsvisning (Dra i bildet for å posisjonere, eller slipp bildefil her)
              </label>
              {isLocalUploadedImage && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {uploadedFileName
                    ? `Lastet opp: ${uploadedFileName}`
                    : 'Bilde fra datamaskin (lagres i utkast)'}
                </span>
              )}
            </div>
            <div
              className={`relative w-full h-56 bg-stone-200 rounded-lg overflow-hidden border-2 shadow-inner flex items-center justify-center cursor-move transition-colors ${
                isFileDropOver
                  ? 'border-purple-600 bg-purple-50/60'
                  : 'border-stone-300'
              }`}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
              onDragOver={(e) => {
                e.preventDefault();
                setIsFileDropOver(true);
              }}
              onDragLeave={() => setIsFileDropOver(false)}
              onDrop={handleFileDrop}
            >
              {isProcessingFile ? (
                <div className="text-stone-700 flex flex-col items-center gap-2 bg-white/90 px-4 py-3 rounded-xl shadow-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="text-xs font-bold">Optimaliserer bilde for lagring i utkast...</span>
                </div>
              ) : url ? (
                <>
                  <img
                    src={url}
                    alt="Utsnitt forhåndsvisning"
                    className="w-full h-full object-cover transition-all"
                    style={{
                      transform: `scale(${zoom})`,
                      objectPosition: `${positionX}% ${positionY}%`,
                    }}
                  />
                  {/* Live interactive annotation layer */}
                  <ImageAnnotationLayer
                    annotations={annotations}
                    interactive={true}
                    selectedId={selectedAnnotationId}
                    onSelect={setSelectedAnnotationId}
                    onUpdateAnnotation={(updated) => {
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === updated.id ? updated : a))
                      );
                    }}
                  />
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="text-stone-500 hover:text-stone-800 flex flex-col items-center gap-1.5 cursor-pointer p-4"
                >
                  <Upload className="w-8 h-8 opacity-60" />
                  <span className="text-xs font-semibold">Klikk for å laste opp fra datamaskin, eller slipp bilde her</span>
                </div>
              )}

              {credit && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none z-20">
                  {credit}
                </div>
              )}
              {caption && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded pointer-events-none z-20">
                  {caption}
                </div>
              )}
            </div>
          </div>

          {/* Arrows, Boxes, Circles & Labels Editor */}
          <AnnotationEditorControls
            annotations={annotations}
            selectedId={selectedAnnotationId}
            onSelect={setSelectedAnnotationId}
            onChange={setAnnotations}
          />

          {/* Quick upload / change options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                Last opp bilde, lim inn link eller velg eksempel
              </label>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="w-4 h-4 text-stone-400" />
                </div>
                <input
                  type="text"
                  placeholder="Lim inn bilde-URL her (f.eks. fra en nettside)"
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
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800 transition-colors shadow-xs"
              >
                <Upload className="w-4 h-4" />
                Last opp fra datamaskin
              </button>

              <div className="flex items-center gap-1.5 pl-2 overflow-x-auto py-1">
                <span className="text-[11px] text-stone-500 whitespace-nowrap">Eksempler:</span>
                <button
                  type="button"
                  onClick={() => setUrl(SAMPLE_IMAGES.bergenClassic)}
                  className="text-[11px] px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded font-medium text-stone-700 whitespace-nowrap"
                >
                  Trehus (Nordnes)
                </button>
                <button
                  type="button"
                  onClick={() => setUrl(SAMPLE_IMAGES.modernBlock)}
                  className="text-[11px] px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded font-medium text-stone-700 whitespace-nowrap"
                >
                  Nybygg (Møllendal)
                </button>
                <button
                  type="button"
                  onClick={() => setUrl(SAMPLE_IMAGES.historicFacade)}
                  className="text-[11px] px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded font-medium text-stone-700 whitespace-nowrap"
                >
                  Klassisk Bygård
                </button>
                <button
                  type="button"
                  onClick={() => setUrl(SAMPLE_IMAGES.modernRender)}
                  className="text-[11px] px-2 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded font-medium text-stone-700 whitespace-nowrap"
                >
                  Arkitektrender
                </button>
              </div>
            </div>
          </div>

          {/* Position & Zoom Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-200">
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
                <span>Zoom</span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
                <span>Vertikal posisjon</span>
                <span>{positionY}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={positionY}
                onChange={(e) => setPositionY(parseInt(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-stone-600 mb-1">
                <span>Horisontal posisjon</span>
                <span>{positionX}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={positionX}
                onChange={(e) => setPositionX(parseInt(e.target.value))}
                className="w-full accent-stone-900 cursor-pointer"
              />
            </div>
          </div>

          {/* Text and Labels for this image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Bildetekst / seksjonsoverskrift
              </label>
              <input
                type="text"
                placeholder="F.eks. «Fra dette:» eller «Hva som rives:»"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">
                Fotokreditt / Kilde
              </label>
              <input
                type="text"
                placeholder="F.eks. «Foto: Bjørn Erik Larsen / BT»"
                value={credit}
                onChange={(e) => setCredit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
          
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Fjern bilde
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-stone-300 hover:bg-stone-100 rounded-lg text-xs font-medium text-stone-700"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-xs"
            >
              <Check className="w-4 h-4" />
              Bruk endringer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
