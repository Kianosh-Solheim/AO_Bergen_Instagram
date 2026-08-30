import React, { useState } from 'react';
import { Slide, SlidePresetType, BrandFont, BRAND_COLORS, SlideImage } from '../types';
import { PRESET_TEMPLATES, SAMPLE_IMAGES } from '../data/defaultPresets';
import {
  Palette,
  Type,
  LayoutTemplate,
  Sliders,
  Image as ImageIcon,
  Plus,
  Edit2,
  Sparkles,
  MessageSquareQuote,
  Smile,
  Coins,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Eye,
  EyeOff,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface EditorSidebarProps {
  slide?: Slide;
  onUpdateSlide: (updatedSlide: Slide) => void;
  onUpdateAllSlidesBgColor?: (hex: string) => void;
  showPurpleGuide: boolean;
  onTogglePurpleGuide: () => void;
  showInstagramUi: boolean;
  onToggleInstagramUi: () => void;
  onOpenImageModal: (image: SlideImage, imageIndex: number) => void;
  onAddSlide?: (preset?: SlidePresetType) => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  slide,
  onUpdateSlide,
  onUpdateAllSlidesBgColor,
  showPurpleGuide,
  onTogglePurpleGuide,
  showInstagramUi,
  onToggleInstagramUi,
  onOpenImageModal,
  onAddSlide,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'meme'>('content');
  const [appliedAllNotice, setAppliedAllNotice] = useState(false);

  if (!slide) {
    return (
      <div className="w-full lg:w-[420px] bg-white border-l border-stone-200 flex flex-col h-full items-center justify-center p-6 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
          <LayoutTemplate className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-stone-900 text-sm">Ingen slide valgt</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-xs">
          Legg til en ny slide i karusellen for å starte redigeringen.
        </p>
        <button
          type="button"
          onClick={() => onAddSlide && onAddSlide('hook')}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Opprett slide</span>
        </button>
      </div>
    );
  }

  const handleApplyColorToAll = (hex: string) => {
    if (onUpdateAllSlidesBgColor) {
      onUpdateAllSlidesBgColor(hex);
      setAppliedAllNotice(true);
      setTimeout(() => setAppliedAllNotice(false), 2500);
    }
  };

  const handlePresetChange = (newPreset: SlidePresetType) => {
    const factory = PRESET_TEMPLATES[newPreset]?.slideFactory;
    if (factory) {
      const templateSlide = factory();
      onUpdateSlide({
        ...templateSlide,
        id: slide.id, // keep current slide ID
        bgColor: slide.bgColor, // preserve chosen brand color
      });
    }
  };

  const handleAddImage = () => {
    const newImage: SlideImage = {
      id: `img-${Date.now()}`,
      url: SAMPLE_IMAGES.modernBlock,
      credit: 'Foto: Kilde',
      aspectRatio: '16:9',
      objectFit: 'cover',
      zoom: 1,
      positionY: 50,
      positionX: 50,
    };
    onUpdateSlide({
      ...slide,
      images: [...slide.images, newImage],
    });
    onOpenImageModal(newImage, slide.images.length);
  };

  return (
    <div className="w-full lg:w-[420px] bg-white border-l border-stone-200 flex flex-col h-full overflow-hidden shadow-sm">
      {/* Top Header & Tabs */}
      <div className="p-4 border-b border-stone-200 bg-stone-50/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="font-bold text-stone-900 text-sm tracking-tight">
              Oppskrift-editor
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded">
            {slide.preset}
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-stone-200/70 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'content'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            Innhold & Layout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'style'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Farger & Font
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('meme')}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'meme'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            Tull & Tøys
          </button>
        </div>
      </div>

      {/* Quick Color Selector Bar (Always accessible) */}
      <div className="px-4 py-2 bg-stone-100/90 border-b border-stone-200 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-stone-600 flex items-center gap-1 text-[11px]">
          <Palette className="w-3.5 h-3.5 text-stone-500" />
          Bakgrunnsfarge:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {BRAND_COLORS.slice(0, 5).map((col) => {
            const isSelected = slide.bgColor?.toLowerCase() === col.hex.toLowerCase();
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => onUpdateSlide({ ...slide, bgColor: col.hex })}
                title={`${col.name} (${col.hex})`}
                className={`w-6 h-6 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'ring-2 ring-stone-900 border-white scale-110 shadow-xs'
                    : 'border-stone-300 hover:scale-105'
                }`}
                style={{ backgroundColor: col.hex }}
              >
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-900 block" />
                )}
              </button>
            );
          })}
          {/* Custom color picker popup trigger */}
          <label
            title="Velg egendefinert farge"
            className="w-6 h-6 rounded-full border border-dashed border-stone-400 hover:border-stone-700 flex items-center justify-center cursor-pointer bg-white"
          >
            <span className="text-[10px] text-stone-600 font-bold">+</span>
            <input
              type="color"
              value={slide.bgColor || '#fff3d1'}
              onChange={(e) => onUpdateSlide({ ...slide, bgColor: e.target.value })}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Main Scrollable Settings Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* TAB 1: INNHOLD & LAYOUT */}
        {activeTab === 'content' && (
          <>
            {/* Preset Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-stone-500" />
                  Velg Mal / Oppskrift Preset
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  Object.keys(PRESET_TEMPLATES) as SlidePresetType[]
                ).map((key) => {
                  const presetInfo = PRESET_TEMPLATES[key];
                  const isSelected = slide.preset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePresetChange(key)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between text-xs ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/80 text-purple-950 shadow-xs ring-1 ring-purple-600'
                          : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <span className="font-bold truncate">{presetInfo.name}</span>
                      <span className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                        {presetInfo.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title / Heading Inputs */}
            {slide.preset !== 'fra_til' && slide.preset !== 'sitat' && (
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Overoverskrift (valgfritt)
                  </label>
                  <input
                    type="text"
                    placeholder="F.eks. «Nytt varsel:»"
                    value={slide.superTitle || ''}
                    onChange={(e) =>
                      onUpdateSlide({ ...slide, superTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-stone-700">
                      Overskrift (Agrandir font)
                    </label>
                    <span className="text-[10px] text-stone-400">
                      Vises innenfor lilla ramme
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="F.eks. «Her skal det bygges..»"
                    value={slide.title}
                    onChange={(e) =>
                      onUpdateSlide({ ...slide, title: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  />
                </div>

                {/* Subtitle if available */}
                {(slide.preset === 'hook' ||
                  slide.preset === 'undertekst' ||
                  slide.preset === 'meme' ||
                  slide.preset === 'flerbilde') && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Underoverskrift / Bildetekst under
                    </label>
                    <input
                      type="text"
                      placeholder="F.eks. «... skal sjøkanten tettes igjen med enda en steril kasse»"
                      value={slide.subtitle || ''}
                      onChange={(e) =>
                        onUpdateSlide({ ...slide, subtitle: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Specific inputs for PRISLAPP preset */}
            {slide.preset === 'prislapp' && (
              <div className="space-y-3 p-3 bg-amber-50/60 rounded-lg border border-amber-200">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>Prislapp & Nøkkeltall innstillinger</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Merkelapp (over tallet)
                  </label>
                  <input
                    type="text"
                    value={slide.headingTag || 'Prislapp:'}
                    onChange={(e) =>
                      onUpdateSlide({ ...slide, headingTag: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded-md bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Stort tall / Beløp
                  </label>
                  <input
                    type="text"
                    value={slide.priceValue || '908 millioner kroner'}
                    onChange={(e) =>
                      onUpdateSlide({ ...slide, priceValue: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 text-sm border border-stone-300 rounded-md bg-white font-extrabold text-stone-900"
                  />
                </div>
              </div>
            )}

            {/* Specific inputs for SITAT / TEKSTSLIDE preset */}
            {slide.preset === 'sitat' && (
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">
                    Ikon / Emoji på toppen
                  </label>
                  <div className="flex gap-1">
                    {['⚒️', '🏛️', '📢', '💰', '📉', '✨', '⚠️'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onUpdateSlide({ ...slide, iconEmoji: emoji })}
                        className={`w-7 h-7 rounded border text-sm flex items-center justify-center ${
                          slide.iconEmoji === emoji
                            ? 'border-purple-600 bg-purple-100'
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Sitat / Brødtekst
                  </label>
                  <textarea
                    rows={6}
                    value={slide.bodyText || ''}
                    onChange={(e) =>
                      onUpdateSlide({ ...slide, bodyText: e.target.value })
                    }
                    placeholder="Skriv inn rapportutdrag eller sitat her..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-normal leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Uthevede ord (kommaseparert for gul markeringspenn)
                  </label>
                  <input
                    type="text"
                    placeholder="f.eks: 257 millioner, nybygg, Byantikvaren"
                    value={slide.highlightWords || ''}
                    onChange={(e) =>
                      onUpdateSlide({ ...slide, highlightWords: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Layout selector for Flerbilde / Gallery */}
            {(slide.preset === 'flerbilde' || slide.images.length > 1) && (
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  Bildeoppsett (Fotovegg/Galleri)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSlide({ ...slide, galleryLayout: 'vertical' })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                      (!slide.galleryLayout || slide.galleryLayout === 'vertical') 
                        ? 'border-purple-600 bg-purple-50 text-purple-700' 
                        : 'border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Stablet (Vertikal)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSlide({ ...slide, galleryLayout: 'horizontal' })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                      slide.galleryLayout === 'horizontal' 
                        ? 'border-purple-600 bg-purple-50 text-purple-700' 
                        : 'border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Side-om-side
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSlide({ ...slide, galleryLayout: 'grid' })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
                      slide.galleryLayout === 'grid' 
                        ? 'border-purple-600 bg-purple-50 text-purple-700' 
                        : 'border-stone-300 bg-stone-50 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Rutenett (Fotovegg)
                  </button>
                </div>
              </div>
            )}

            {/* Images List & Actions */}
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                  Bilder i denne sliden ({slide.images.length})
                </label>
                {slide.images.length < 3 && (
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Legg til bilde
                  </button>
                )}
              </div>

              {slide.images.length === 0 ? (
                <div className="p-4 rounded-lg bg-stone-100 border border-stone-200 text-center text-xs text-stone-500">
                  Ingen bilder i denne sliden (ren tekst/sitat-slide).
                </div>
              ) : (
                <div className="space-y-2">
                  {slide.images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 hover:border-stone-300 bg-stone-50/70"
                    >
                      {img.url ? (
                        <img
                          src={img.url}
                          alt="Thumbnail"
                          className="w-14 h-14 object-cover rounded-md border border-stone-300 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-md border-2 border-dashed border-stone-300 bg-stone-100 flex flex-col items-center justify-center text-stone-400 flex-shrink-0">
                          <ImageIcon className="w-5 h-5 text-stone-400" />
                          <span className="text-[8px] font-medium mt-0.5">Ingen bilde</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-800 truncate">
                          {img.caption || `Bilde #${idx + 1}`}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {img.credit || 'Ingen kilde angitt'}
                        </p>
                        <p className="text-[10px] text-purple-600 font-medium">
                          Zoom: {img.zoom?.toFixed(1) || '1.0'}x
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenImageModal(img, idx)}
                        className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-md text-xs font-semibold text-stone-700 flex items-center gap-1 shadow-2xs"
                      >
                        <Edit2 className="w-3 h-3" />
                        Juster
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Source / Kilde Footer Input */}
            <div className="pt-2 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Kildehenvisning nederst (f.eks. «Kilde: Bergens Tidende»)
              </label>
              <input
                type="text"
                placeholder="Kilde: Bergens Tidende"
                value={slide.sourceCredit || ''}
                onChange={(e) =>
                  onUpdateSlide({ ...slide, sourceCredit: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </>
        )}

        {/* TAB 2: FARGER & FONT */}
        {activeTab === 'style' && (
          <>
            {/* Brand Colors from PDF Recipe */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-stone-500" />
                  Oppskriftens Bakgrunnsfarger
                </label>
                {slide.bgColor && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-stone-100 border border-stone-300 text-stone-800">
                    Aktiv: {slide.bgColor}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 leading-snug">
                Fargene danner lerretet på hele Instagram-innlegget (1080×1350) bak overskrift, ramme og innhold.
              </p>

              {/* Grid of colors */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {BRAND_COLORS.map((col) => {
                  const isSelected =
                    slide.bgColor?.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => onUpdateSlide({ ...slide, bgColor: col.hex })}
                      className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-stone-900 ring-2 ring-stone-900 shadow-xs bg-white'
                          : 'border-stone-200 hover:border-stone-400 bg-stone-50/50'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-md border border-black/20 shadow-2xs flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: col.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {col.name}
                        </p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {col.hex}
                        </p>
                        {col.description && (
                          <p className="text-[9px] text-stone-400 leading-tight mt-0.5 line-clamp-1">
                            {col.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-emerald-600 absolute top-2 right-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Hex input & color picker */}
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-700 font-semibold">
                    Egendefinert farge:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={slide.bgColor || '#fff3d1'}
                      onChange={(e) =>
                        onUpdateSlide({ ...slide, bgColor: e.target.value })
                      }
                      className="w-8 h-8 rounded border border-stone-300 cursor-pointer p-0.5 bg-white"
                      title="Velg med fargevelger"
                    />
                    <input
                      type="text"
                      value={slide.bgColor || ''}
                      placeholder="#fffdf7"
                      onChange={(e) =>
                        onUpdateSlide({ ...slide, bgColor: e.target.value })
                      }
                      className="w-24 px-2 py-1 text-xs font-mono border border-stone-300 rounded uppercase bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Apply to all slides button */}
                {onUpdateAllSlidesBgColor && (
                  <div className="pt-2 border-t border-stone-200/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleApplyColorToAll(slide.bgColor || '#fff3d1')}
                      className="w-full py-1.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Palette className="w-3 h-3 text-purple-600" />
                      <span>Bruk denne fargen på alle slides</span>
                    </button>
                  </div>
                )}
                {appliedAllNotice && (
                  <p className="text-[11px] text-emerald-700 font-medium text-center animate-pulse">
                    ✓ Bakgrunnsfargen er nå brukt på alle slides!
                  </p>
                )}
              </div>
            </div>

            {/* Font Picker */}
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-stone-500" />
                Fontvalg
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSlide({ ...slide, font: 'agrandir' })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    slide.font === 'agrandir'
                      ? 'border-purple-600 bg-purple-50/80 text-purple-950 font-bold ring-1 ring-purple-600'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <p className="text-sm font-agrandir font-extrabold">Agrandir</p>
                  <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                    Hovedfont i oppskriften
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSlide({ ...slide, font: 'comic' })}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    slide.font === 'comic'
                      ? 'border-purple-600 bg-purple-50/80 text-purple-950 font-bold ring-1 ring-purple-600'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <p className="text-sm font-comic font-bold">Comic Sans</p>
                  <p className="text-[10px] text-stone-500 font-normal mt-0.5">
                    «Noen ganger bruker vi fonten Comic Sans»
                  </p>
                </button>
              </div>
            </div>

            {/* Typography Alignment & Sizing */}
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-stone-500" />
                Overskriftens Justering & Størrelse
              </label>

              <div className="flex gap-2">
                <div className="flex-1 bg-stone-100 p-1 rounded-lg flex">
                  <button
                    type="button"
                    onClick={() => onUpdateSlide({ ...slide, titleAlign: 'left' })}
                    className={`flex-1 py-1.5 rounded flex justify-center ${
                      slide.titleAlign === 'left'
                        ? 'bg-white shadow-xs text-stone-900'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlide({ ...slide, titleAlign: 'center' })
                    }
                    className={`flex-1 py-1.5 rounded flex justify-center ${
                      slide.titleAlign === 'center'
                        ? 'bg-white shadow-xs text-stone-900'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlide({ ...slide, titleAlign: 'right' })
                    }
                    className={`flex-1 py-1.5 rounded flex justify-center ${
                      slide.titleAlign === 'right'
                        ? 'bg-white shadow-xs text-stone-900'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  <select
                    value={slide.titleSize}
                    onChange={(e) =>
                      onUpdateSlide({
                        ...slide,
                        titleSize: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="sm">Liten (28px)</option>
                    <option value="md">Normal (36px)</option>
                    <option value="lg">Stor (44px)</option>
                    <option value="xl">Ekstra Stor (54px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Spacing Gap rule from PDF */}
            <div className="space-y-2 pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <span>Avstand overskrift/bilde</span>
                </label>
                <span className="text-[10px] text-purple-700 font-medium">
                  «Pass på at avstanden ikke er for stor»
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'tight', label: 'Tett (Anbefalt)' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'relaxed', label: 'Romslig' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onUpdateSlide({ ...slide, spacingGap: item.id as any })
                    }
                    className={`py-1.5 px-2 text-xs rounded-md border font-medium ${
                      slide.spacingGap === item.id
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 3: TULL & TØYS (MEME OVERLAYS) */}
        {activeTab === 'meme' && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg">
              <p className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                <Smile className="w-4 h-4 text-indigo-600" />
                «Lov med litt tull og tøys» (PDF s. 4)
              </p>
              <p className="text-[11px] text-indigo-800 mt-1">
                Bruk snakkebobler, gule rEAliTy-klistremerker og Comic Sans for
                humoristiske og skarpe innlegg.
              </p>
            </div>

            {/* Speech Bubble Switcher */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">
                  Snakkeboble på bildet
                </label>
                <input
                  type="checkbox"
                  checked={slide.speechBubble?.enabled ?? false}
                  onChange={(e) =>
                    onUpdateSlide({
                      ...slide,
                      speechBubble: {
                        enabled: e.target.checked,
                        text:
                          slide.speechBubble?.text ||
                          'Fuck you, historiske Bergen!',
                        position:
                          slide.speechBubble?.position || 'top-right',
                        font: 'comic',
                        rotation: -3,
                      },
                    })
                  }
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>

              {slide.speechBubble?.enabled && (
                <div className="space-y-2.5 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Snakkeboble tekst
                    </label>
                    <input
                      type="text"
                      value={slide.speechBubble.text}
                      onChange={(e) =>
                        onUpdateSlide({
                          ...slide,
                          speechBubble: {
                            ...slide.speechBubble!,
                            text: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-stone-300 rounded font-comic font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Posisjon
                    </label>
                    <select
                      value={slide.speechBubble.position}
                      onChange={(e) =>
                        onUpdateSlide({
                          ...slide,
                          speechBubble: {
                            ...slide.speechBubble!,
                            position: e.target.value as any,
                          },
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-stone-300 rounded bg-white"
                    >
                      <option value="top-right">Øverst til høyre</option>
                      <option value="top-left">Øverst til venstre</option>
                      <option value="bottom-right">Nederst til høyre</option>
                      <option value="bottom-left">Nederst til venstre</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Yellow Reality Tag */}
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-800">
                  Gul «rEAliTy:» tag
                </p>
                <p className="text-[10px] text-stone-500">
                  Plasseres i øvre venstre hjørne av bildet
                </p>
              </div>
              <input
                type="checkbox"
                checked={slide.showRealityTag ?? false}
                onChange={(e) =>
                  onUpdateSlide({
                    ...slide,
                    showRealityTag: e.target.checked,
                    headingTag: e.target.checked ? 'rEAliTy:' : '',
                  })
                }
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer View Helpers & Guide Toggles */}
      <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={onTogglePurpleGuide}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
            showPurpleGuide
              ? 'bg-purple-100 text-purple-900 border border-purple-300'
              : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100'
          }`}
        >
          {showPurpleGuide ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Lilla justeringsramme</span>
        </button>

        <button
          type="button"
          onClick={onToggleInstagramUi}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all ${
            showInstagramUi
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 border border-stone-300 hover:bg-stone-100'
          }`}
        >
          <span>Instagram feed-ramme</span>
        </button>
      </div>
    </div>
  );
};
