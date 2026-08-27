import React, { useState, useRef } from 'react';
import { SlideImage } from '../types';
import { SAMPLE_IMAGES } from '../data/defaultPresets';
import { Upload, Image as ImageIcon, ZoomIn, Move, X, Check, Link, Trash2 } from 'lucide-react';

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
  const [urlInput, setUrlInput] = useState('');
  const [isUrlMode, setIsUrlMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          setUrl(loadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      ...image,
      url,
      credit,
      caption,
      zoom,
      positionY,
      positionX,
      labelTag,
    });
    onClose();
  };

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
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
              Forhåndsvisning med utsnitt og zoom
            </label>
            <div className="relative w-full h-56 bg-stone-200 rounded-lg overflow-hidden border border-stone-300 shadow-inner flex items-center justify-center">
              {url ? (
                <img
                  src={url}
                  alt="Utsnitt forhåndsvisning"
                  className="w-full h-full object-cover transition-all"
                  style={{
                    transform: `scale(${zoom})`,
                    objectPosition: `${positionX}% ${positionY}%`,
                  }}
                />
              ) : (
                <div className="text-stone-400 flex flex-col items-center gap-1">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                  <span className="text-xs">Ingen bilde valgt</span>
                </div>
              )}

              {credit && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">
                  {credit}
                </div>
              )}
              {caption && (
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded">
                  {caption}
                </div>
              )}
            </div>
          </div>

          {/* Quick upload / change options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
                Last opp eget bilde eller velg eksempelfoto
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIsUrlMode(!isUrlMode)}
                  className="text-stone-600 hover:text-stone-900 underline flex items-center gap-1"
                >
                  <Link className="w-3.5 h-3.5" />
                  {isUrlMode ? 'Skjul URL-felt' : 'Lim inn URL'}
                </button>
              </div>
            </div>

            {isUrlMode && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://eksempel.no/bilde.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (urlInput.trim()) {
                      setUrl(urlInput.trim());
                      setUrlInput('');
                    }
                  }}
                  className="px-3 py-2 bg-stone-800 text-white text-xs font-medium rounded-lg hover:bg-stone-900"
                >
                  Bruk
                </button>
              </div>
            )}

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

          {/* Meme Label Tag (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              Valgfri merkelapp / Meme-tag (vises i hjørnet av bildet)
            </label>
            <input
              type="text"
              placeholder="F.eks. «Gru sitt hus | Despicable me» eller «Møllendalsveien 1C»"
              value={labelTag}
              onChange={(e) => setLabelTag(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
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
