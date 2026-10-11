import React, { useState, useRef } from 'react';
import { Slide, SlidePresetType, BrandFont, BRAND_COLORS, SlideImage } from '../types';
import { PRESET_TEMPLATES, SAMPLE_IMAGES } from '../data/defaultPresets';
import { NEWSPAPER_LOGOS } from '../data/newspaperLogos';
import { compressImageFile, compressTransparentLogoFile, removeWhiteBackgroundFromLogo } from '../lib/imageUtils';
import { AnnotationEditorControls } from './ImageAnnotationLayer';
import {
  Palette,
  Type,
  LayoutTemplate,
  Sliders,
  Image as ImageIcon,
  Plus,
  Edit2,
  Upload,
  Loader2,
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
  Newspaper,
  Ban,
  AlertTriangle,
  Wand2,
  ArrowUpRight,
} from 'lucide-react';

import { CarouselProject } from "../types";
interface EditorSidebarProps {
  project?: CarouselProject;
  onUpdateProject?: (project: CarouselProject) => void;
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
  project,
  onUpdateProject,
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
  const [appliedSpacingNotice, setAppliedSpacingNotice] = useState(false);
  const [appliedSizeNotice, setAppliedSizeNotice] = useState(false);
  const [appliedPositionNotice, setAppliedPositionNotice] = useState(false);
  const [uploadingImageSlot, setUploadingImageSlot] = useState<number | 'new' | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeAnnotationImgIndex, setActiveAnnotationImgIndex] = useState<number>(0);
  const [selectedSidebarAnnotationId, setSelectedSidebarAnnotationId] = useState<string | null>(null);
  const sidebarFileInputRef = useRef<HTMLInputElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const targetSlotRef = useRef<number | 'new'>('new');

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

  const triggerDirectComputerUpload = (slot: number | 'new') => {
    targetSlotRef.current = slot;
    sidebarFileInputRef.current?.click();
  };

  const handleDirectComputerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !slide) return;
    const slot = targetSlotRef.current;
    setUploadingImageSlot(slot);
    try {
      const optimizedUrl = await compressImageFile(file);
      if (slot === 'new') {
        const newImage: SlideImage = {
          id: `img-${Date.now()}`,
          url: optimizedUrl,
          credit: '',
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
      } else {
        const updatedImages = [...slide.images];
        const existing = updatedImages[slot] || {
          id: `img-${Date.now()}-${slot}`,
          url: '',
          credit: '',
          aspectRatio: '16:9',
          objectFit: 'cover',
          zoom: 1,
          positionY: 50,
          positionX: 50,
        };
        updatedImages[slot] = {
          ...existing,
          url: optimizedUrl,
        };
        onUpdateSlide({
          ...slide,
          images: updatedImages,
        });
      }
    } catch (err) {
      console.error('Feil ved direkte bildeopplasting:', err);
    } finally {
      setUploadingImageSlot(null);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full lg:w-[420px] bg-white lg:border-l border-stone-200 flex flex-col h-full overflow-hidden shadow-sm flex-shrink-0">
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

                {/* Plassering av overskrift (Over / Under bilde) */}
                <div className="space-y-1.5 pt-2 border-t border-stone-200">
                  <label className="block text-xs font-bold text-stone-700">
                    Plassering av overskrift
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateSlide({ ...slide, titlePosition: 'above' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        (slide.titlePosition || 'above') === 'above'
                          ? 'border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600 shadow-xs'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span>⬆️ Over bilde (Standard)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateSlide({ ...slide, titlePosition: 'below' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        slide.titlePosition === 'below'
                          ? 'border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600 shadow-xs'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <span>⬇️ Under bilde</span>
                    </button>
                  </div>
                  {project && onUpdateProject && (
                    <button
                      type="button"
                      onClick={() => {
                        const pos = slide.titlePosition || 'above';
                        const updatedSlides = project.slides.map((s) => ({
                          ...s,
                          titlePosition: pos,
                        }));
                        onUpdateProject({
                          ...project,
                          slides: updatedSlides,
                          titlePosition: pos,
                        });
                        setAppliedPositionNotice(true);
                        setTimeout(() => setAppliedPositionNotice(false), 3000);
                      }}
                      className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <span>Bruk denne plasseringen på alle slides</span>
                    </button>
                  )}
                  {appliedPositionNotice && (
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      ✓ Plassering er nå oppdatert på alle slides!
                    </p>
                  )}
                </div>
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
              <div className="space-y-3.5 pt-2 border-t border-stone-200">
                {/* Velg topp-element: Emoji, Avislogo eller Ingen */}
                <div className="space-y-2.5 bg-stone-50/80 p-3 rounded-xl border border-stone-200">
                  <label className="block text-xs font-bold text-stone-800">
                    Topp-element over sitatet
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'emoji' as const, label: 'Emoji', Icon: Smile },
                      { id: 'logo' as const, label: 'Avislogo', Icon: Newspaper },
                      { id: 'none' as const, label: 'Ingen', Icon: Ban },
                    ].map(({ id, label, Icon }) => {
                      const activeType = slide.topBadgeType || 'emoji';
                      const isSelected = activeType === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            if (id === 'logo' && !slide.topLogoUrl) {
                              const defaultLogo = NEWSPAPER_LOGOS[0];
                              onUpdateSlide({
                                ...slide,
                                topBadgeType: 'logo',
                                topLogoId: defaultLogo.id,
                                topLogoUrl: defaultLogo.dataUrl,
                                topBadgeSize: slide.topBadgeSize ?? 42,
                              });
                            } else {
                              onUpdateSlide({
                                ...slide,
                                topBadgeType: id,
                              });
                            }
                          }}
                          className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                              : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* EMOJI VELGER (Alle mulige emojier + hurtigvalg) */}
                  {(slide.topBadgeType || 'emoji') === 'emoji' && (
                    <div className="space-y-2 pt-2 border-t border-stone-200/80">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-stone-700">
                          Skriv inn hvilken som helst emoji:
                        </span>
                        <input
                          type="text"
                          value={slide.iconEmoji ?? '🏛️'}
                          onChange={(e) =>
                            onUpdateSlide({
                              ...slide,
                              topBadgeType: 'emoji',
                              iconEmoji: e.target.value,
                            })
                          }
                          placeholder="🏛️"
                          className="w-20 px-2 py-1 text-center text-lg border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          title="Lim inn eller skriv hvilken som helst emoji (Win + . eller Cmd + Ctrl + Mellomrom)"
                        />
                      </div>

                      <div>
                        <span className="block text-[10px] text-stone-500 mb-1">
                          Eller velg blant hurtig-emojier:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {[
                            '🏛️', '⚒️', '📢', '💰', '📉', '📈', '✨', '⚠️',
                            '📰', '💬', '🏗️', '🧱', '🏘️', '🚨', '🤔', '👀',
                            '💔', '❤️', '🔥', '🛑', '📜', '🔍', '⚖️', '🌧️',
                          ].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() =>
                                onUpdateSlide({
                                  ...slide,
                                  topBadgeType: 'emoji',
                                  iconEmoji: emoji,
                                })
                              }
                              className={`w-7 h-7 rounded border text-sm flex items-center justify-center transition-colors cursor-pointer ${
                                slide.iconEmoji === emoji
                                  ? 'border-purple-600 bg-purple-100 ring-1 ring-purple-500'
                                  : 'border-stone-200 bg-white hover:bg-stone-100'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Størrelse på emoji */}
                      <div className="pt-1">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="font-semibold text-stone-600">Størrelse på emoji</span>
                          <span className="font-mono font-bold text-stone-700">
                            {slide.topBadgeSize ?? 38} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="22"
                          max="76"
                          step="2"
                          value={slide.topBadgeSize ?? 38}
                          onChange={(e) =>
                            onUpdateSlide({
                              ...slide,
                              topBadgeSize: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                        />
                      </div>
                    </div>
                  )}

                  {/* AVISLOGO VELGER (BT, BA + Last opp egen logo uten bakgrunn) */}
                  {slide.topBadgeType === 'logo' && (
                    <div className="space-y-2.5 pt-2 border-t border-stone-200/80">
                      <div>
                        <span className="block text-[11px] font-semibold text-stone-700 mb-1.5">
                          Velg ferdig avislogo (uten bakgrunn):
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {NEWSPAPER_LOGOS.map((logo) => {
                            const isSelected =
                              slide.topLogoId === logo.id || slide.topLogoUrl === logo.dataUrl;
                            return (
                              <button
                                key={logo.id}
                                type="button"
                                onClick={() =>
                                  onUpdateSlide({
                                    ...slide,
                                    topBadgeType: 'logo',
                                    topLogoId: logo.id,
                                    topLogoUrl: logo.dataUrl,
                                    sourceCredit:
                                      !slide.sourceCredit || slide.sourceCredit.startsWith('Kilde:')
                                        ? logo.defaultSourceCredit
                                        : slide.sourceCredit,
                                  })
                                }
                                className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-50/90 ring-1 ring-purple-600'
                                    : 'border-stone-200 bg-white hover:bg-stone-100'
                                }`}
                              >
                                <div className="h-6 flex items-center justify-center px-1">
                                  <img
                                    src={logo.dataUrl}
                                    alt={logo.name}
                                    className="max-h-5 max-w-[115px] object-contain"
                                  />
                                </div>
                                <span className="text-[10px] font-bold text-stone-600 truncate max-w-full">
                                  {logo.shortLabel}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Last opp egen avislogo uten bakgrunn */}
                      <div className="pt-2 border-t border-stone-200/80 space-y-2">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-900 leading-snug font-medium">
                            <strong>Viktig:</strong> Logoen du laster opp <strong>kan ikke ha bakgrunn</strong> (bruk gjennomsiktig PNG, SVG eller WebP uten hvit boks rundt).
                          </p>
                        </div>

                        <input
                          ref={logoFileInputRef}
                          type="file"
                          accept="image/png,image/svg+xml,image/webp,image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingLogo(true);
                            try {
                              const dataUrl = await compressTransparentLogoFile(file);
                              onUpdateSlide({
                                ...slide,
                                topBadgeType: 'logo',
                                topLogoId: 'custom',
                                topLogoUrl: dataUrl,
                              });
                            } catch (err) {
                              console.error('Feil ved opplasting av logo:', err);
                            } finally {
                              setUploadingLogo(false);
                              e.target.value = '';
                            }
                          }}
                        />

                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="flex-1 py-2 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                          >
                            {uploadingLogo ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                                <span>Laster opp...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 text-purple-600" />
                                <span>Last opp avislogo (uten bakgrunn)</span>
                              </>
                            )}
                          </button>

                          {slide.topLogoUrl && slide.topLogoId === 'custom' && (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!slide.topLogoUrl) return;
                                setUploadingLogo(true);
                                try {
                                  const cleaned = await removeWhiteBackgroundFromLogo(slide.topLogoUrl);
                                  onUpdateSlide({
                                    ...slide,
                                    topLogoUrl: cleaned,
                                  });
                                } finally {
                                  setUploadingLogo(false);
                                }
                              }}
                              title="Har logoen likevel hvit bakgrunn? Klikk for å fjerne hvit bakgrunn automatisk"
                              className="px-2.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              <span>Fjern hvit</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Størrelse på avislogo */}
                      <div className="pt-1">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="font-semibold text-stone-600">Størrelse på avislogo</span>
                          <span className="font-mono font-bold text-stone-700">
                            {slide.topBadgeSize ?? 42} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="88"
                          step="2"
                          value={slide.topBadgeSize ?? 42}
                          onChange={(e) =>
                            onUpdateSlide({
                              ...slide,
                              topBadgeSize: parseInt(e.target.value, 10),
                            })
                          }
                          className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
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

                {/* Tekststørrelse på sitatet */}
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-700 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-purple-600" />
                      <span>Tekststørrelse på sitat</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {slide.bodyFontSize ?? 17} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="11"
                    max="34"
                    step="1"
                    value={slide.bodyFontSize ?? 17}
                    onChange={(e) =>
                      onUpdateSlide({
                        ...slide,
                        bodyFontSize: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                  />
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {[
                      { label: 'Liten (14px)', size: 14 },
                      { label: 'Normal (17px)', size: 17 },
                      { label: 'Stor (21px)', size: 21 },
                      { label: 'Ekstra (25px)', size: 25 },
                    ].map((preset) => (
                      <button
                        key={preset.size}
                        type="button"
                        onClick={() =>
                          onUpdateSlide({
                            ...slide,
                            bodyFontSize: preset.size,
                          })
                        }
                        className={`py-1 px-1.5 rounded border text-[10px] font-bold transition-colors cursor-pointer ${
                          (slide.bodyFontSize ?? 17) === preset.size
                            ? 'border-purple-600 bg-purple-100 text-purple-900'
                            : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-600'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tekstjustering på sitatet (Venstre / Sentrert / Høyre) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Tekstjustering på sitat
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'left' as const, label: 'Venstre', Icon: AlignLeft },
                      { id: 'center' as const, label: 'Sentrert', Icon: AlignCenter },
                      { id: 'right' as const, label: 'Høyre', Icon: AlignRight },
                    ].map(({ id, label, Icon }) => {
                      const currentAlign = slide.bodyAlign || slide.titleAlign || 'left';
                      const isSelected = currentAlign === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            onUpdateSlide({
                              ...slide,
                              bodyAlign: id,
                              titleAlign: id,
                            })
                          }
                          className={`py-2 px-2.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600 shadow-xs'
                              : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
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
              <input
                ref={sidebarFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDirectComputerFileChange}
                className="hidden"
              />
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                  Bilder i denne sliden ({slide.images.length})
                </label>
                {slide.images.length < 3 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => triggerDirectComputerUpload('new')}
                      disabled={uploadingImageSlot !== null}
                      className="text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                      title="Last opp bilde direkte fra datamaskin eller mobil"
                    >
                      {uploadingImageSlot === 'new' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3" />
                      )}
                      <span>Last opp fra PC</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Malbilde
                    </button>
                  </div>
                )}
              </div>

              {slide.images.length === 0 ? (
                <div className="p-4 rounded-lg bg-stone-100 border border-stone-200 text-center space-y-2">
                  <p className="text-xs text-stone-500">
                    Ingen bilder i denne sliden ennå.
                  </p>
                  <button
                    type="button"
                    onClick={() => triggerDirectComputerUpload('new')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Last opp bilde fra datamaskin
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {slide.images.map((img, idx) => {
                    const isUploadedFromPC = Boolean(img.url && img.url.startsWith('data:image/'));
                    return (
                      <div
                        key={img.id || idx}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-stone-200 hover:border-stone-300 bg-stone-50/70"
                      >
                        {img.url ? (
                          <img
                            src={img.url}
                            alt="Thumbnail"
                            className="w-14 h-14 object-cover rounded-md border border-stone-300 flex-shrink-0 cursor-pointer"
                            onClick={() => onOpenImageModal(img, idx)}
                          />
                        ) : (
                          <div
                            onClick={() => triggerDirectComputerUpload(idx)}
                            className="w-14 h-14 rounded-md border-2 border-dashed border-stone-300 hover:border-purple-400 bg-stone-100 flex flex-col items-center justify-center text-stone-400 flex-shrink-0 cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-stone-400" />
                            <span className="text-[8px] font-medium mt-0.5">Last opp</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-stone-800 truncate">
                              {img.caption || `Bilde #${idx + 1}`}
                            </p>
                            {isUploadedFromPC && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 flex-shrink-0">
                                Fra PC
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 truncate">
                            {img.credit || 'Ingen kilde angitt'}
                          </p>
                          <p className="text-[10px] text-purple-600 font-medium">
                            Zoom: {img.zoom?.toFixed(1) || '1.0'}x
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => triggerDirectComputerUpload(idx)}
                            disabled={uploadingImageSlot !== null}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                            title="Last opp bilde fra datamaskin til denne plassen"
                          >
                            {uploadingImageSlot === idx ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3" />
                            )}
                            Last opp
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenImageModal(img, idx)}
                            className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded-md text-[11px] font-semibold text-stone-700 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            Juster
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Direct Arrows, Boxes & Annotations Panel for Slide Images */}
                  {(() => {
                    const safeImgIdx =
                      activeAnnotationImgIndex < slide.images.length
                        ? activeAnnotationImgIndex
                        : 0;
                    const targetImg = slide.images[safeImgIdx];
                    if (!targetImg) return null;

                    return (
                      <div className="pt-2 space-y-2">
                        {slide.images.length > 1 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-stone-600">
                              Velg bilde å markere på:
                            </span>
                            {slide.images.map((im, i) => (
                              <button
                                key={im.id || i}
                                type="button"
                                onClick={() => {
                                  setActiveAnnotationImgIndex(i);
                                  setSelectedSidebarAnnotationId(
                                    im.annotations?.[0]?.id || null
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                                  safeImgIdx === i
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                                }`}
                              >
                                {im.caption || `Bilde #${i + 1}`}
                                {im.annotations && im.annotations.length > 0
                                  ? ` (${im.annotations.length})`
                                  : ''}
                              </button>
                            ))}
                          </div>
                        )}

                        <AnnotationEditorControls
                          annotations={targetImg.annotations || []}
                          selectedId={selectedSidebarAnnotationId}
                          onSelect={setSelectedSidebarAnnotationId}
                          onChange={(updatedAnnotations) => {
                            const updatedImages = [...slide.images];
                            updatedImages[safeImgIdx] = {
                              ...targetImg,
                              annotations: updatedAnnotations,
                            };
                            onUpdateSlide({ ...slide, images: updatedImages });
                          }}
                        />
                      </div>
                    );
                  })()}
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
              
              {/* Agrandir Version Selector */}
              {project && onUpdateProject && (
                <div className="mt-3">
                  <label className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2 block">
                    Agrandir Versjon (Gjelder hele malen)
                  </label>
                  <select
                    value={project.agrandirVariant || 'Agrandir-Regular'}
                    onChange={(e) =>
                      onUpdateProject({ ...project, agrandirVariant: e.target.value })
                    }
                    className="w-full p-2 text-sm border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  >
                    <option value="Agrandir-Regular">Agrandir Regular (Standard)</option>
                    <option value="Agrandir-TextBold">Agrandir TextBold</option>
                    <option value="Agrandir-GrandLight">Agrandir GrandLight</option>
                    <option value="Agrandir-GrandHeavy">Agrandir GrandHeavy</option>
                    <option value="Agrandir-Narrow">Agrandir Narrow</option>
                    <option value="Agrandir-ThinItalic">Agrandir ThinItalic</option>
                    <option value="Agrandir-Tight">Agrandir Tight</option>
                    <option value="Agrandir-WideBlackItalic">Agrandir WideBlackItalic</option>
                    <option value="Agrandir-WideLight">Agrandir WideLight</option>
                  </select>
                </div>
              )}
            </div>

            {/* Typography Alignment & Sizing */}
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-stone-500" />
                {slide.preset === 'sitat' ? 'Sitatets Justering & Størrelse' : 'Overskriftens Justering & Størrelse'}
              </label>

              <div className="flex gap-2">
                <div className="flex-1 bg-stone-100 p-1 rounded-lg flex">
                  <button
                    type="button"
                    onClick={() => onUpdateSlide({ ...slide, titleAlign: 'left', bodyAlign: 'left' })}
                    className={`flex-1 py-1.5 rounded flex justify-center ${
                      (slide.preset === 'sitat' ? (slide.bodyAlign || slide.titleAlign || 'left') : slide.titleAlign) === 'left'
                        ? 'bg-white shadow-xs text-stone-900'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Venstrejustert"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlide({ ...slide, titleAlign: 'center', bodyAlign: 'center' })
                    }
                    className={`flex-1 py-1.5 rounded flex justify-center ${
                      (slide.preset === 'sitat' ? (slide.bodyAlign || slide.titleAlign || 'left') : slide.titleAlign) === 'center'
                        ? 'bg-white shadow-xs text-stone-900'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Sentrert"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSlide({ ...slide, titleAlign: 'right', bodyAlign: 'right' })
                    }
                    className={`flex-1 py-1.5 rounded flex justify-center ${
                      (slide.preset === 'sitat' ? (slide.bodyAlign || slide.titleAlign || 'left') : slide.titleAlign) === 'right'
                        ? 'bg-white shadow-xs text-stone-900'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="Høyrejustert"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1">
                  {slide.preset === 'sitat' ? (
                    <select
                      value={slide.bodyFontSize ?? 17}
                      onChange={(e) =>
                        onUpdateSlide({
                          ...slide,
                          bodyFontSize: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={14}>Liten (14px)</option>
                      <option value={17}>Normal (17px)</option>
                      <option value={21}>Stor (21px)</option>
                      <option value={25}>Ekstra Stor (25px)</option>
                      <option value={30}>Kjempe (30px)</option>
                    </select>
                  ) : (
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
                  )}
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

            {/* Tekststørrelser (Font size) Sliders */}
            <div className="space-y-3.5 pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-stone-500" />
                  Tekststørrelse (Font Size)
                </label>
                <span className="text-[10px] text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Sliders
                </span>
              </div>

              {/* 1. Overskrift Størrelse Slider */}
              <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">Overskrifter (Tittel)</span>
                  <span className="font-mono text-xs font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-300">
                    {slide.titleFontSize ?? (slide.titleSize === 'sm' ? 28 : slide.titleSize === 'md' ? 36 : slide.titleSize === 'xl' ? 54 : 40)} px
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="72"
                  step="1"
                  value={slide.titleFontSize ?? (slide.titleSize === 'sm' ? 28 : slide.titleSize === 'md' ? 36 : slide.titleSize === 'xl' ? 54 : 40)}
                  onChange={(e) =>
                    onUpdateSlide({
                      ...slide,
                      titleFontSize: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>20px (Liten)</span>
                  <span>40px (Standard)</span>
                  <span>72px (Stor)</span>
                </div>
              </div>

              {/* 2. Underoverskrift / Ingress Størrelse Slider */}
              <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">Underoverskrift & Ingress</span>
                  <span className="font-mono text-xs font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-300">
                    {slide.subtitleFontSize ?? 17} px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="36"
                  step="1"
                  value={slide.subtitleFontSize ?? 17}
                  onChange={(e) =>
                    onUpdateSlide({
                      ...slide,
                      subtitleFontSize: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>12px</span>
                  <span>17px (Standard)</span>
                  <span>36px</span>
                </div>
              </div>

              {/* 3. Brødtekst / Sitat / Kilde Størrelse Slider */}
              <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">Brødtekst, Sitat & Kilde</span>
                  <span className="font-mono text-xs font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-300">
                    {slide.bodyFontSize ?? 15} px
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="1"
                  value={slide.bodyFontSize ?? 15}
                  onChange={(e) =>
                    onUpdateSlide({
                      ...slide,
                      bodyFontSize: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>10px</span>
                  <span>15px (Standard)</span>
                  <span>30px</span>
                </div>
              </div>

              {/* Bruk tekststørrelser på alle slides */}
              {project && onUpdateProject && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const tSize = slide.titleFontSize ?? (slide.titleSize === 'sm' ? 28 : slide.titleSize === 'md' ? 36 : slide.titleSize === 'xl' ? 54 : 40);
                      const sSize = slide.subtitleFontSize ?? 17;
                      const bSize = slide.bodyFontSize ?? 15;
                      const updatedSlides = project.slides.map((s) => ({
                        ...s,
                        titleFontSize: tSize,
                        subtitleFontSize: sSize,
                        bodyFontSize: bSize,
                      }));
                      onUpdateProject({
                        ...project,
                        slides: updatedSlides,
                        titleFontSize: tSize,
                        subtitleFontSize: sSize,
                        bodyFontSize: bSize,
                      });
                      setAppliedSizeNotice(true);
                      setTimeout(() => setAppliedSizeNotice(false), 3000);
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 text-purple-600" />
                    <span>Bruk tekststørrelser på alle slides</span>
                  </button>
                  {appliedSizeNotice && (
                    <p className="text-[11px] text-emerald-700 font-medium text-center mt-1.5">
                      ✓ Tekststørrelser er nå oppdatert på alle slides!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bokstavavstand (Letter spacing tracking) Sliders */}
            <div className="space-y-3.5 pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-stone-500" />
                  Bokstavavstand (Mellomrom)
                </label>
                <span className="text-[10px] text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Sliders
                </span>
              </div>

              {/* 1. Overskrift Slider */}
              <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">Overskrifter (Tittel)</span>
                  <span className="font-mono text-xs font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-300">
                    {(slide.titleLetterSpacing ?? 0.5).toFixed(1)} px
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="10"
                  step="0.25"
                  value={slide.titleLetterSpacing ?? 0.5}
                  onChange={(e) =>
                    onUpdateSlide({
                      ...slide,
                      titleLetterSpacing: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>Tett (-2px)</span>
                  <span>Normal (0.5px)</span>
                  <span>Bred (+10px)</span>
                </div>
              </div>

              {/* 2. Underoverskrift Slider */}
              <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">Underoverskrift & Ingress</span>
                  <span className="font-mono text-xs font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-300">
                    {(slide.subtitleLetterSpacing ?? 0.3).toFixed(1)} px
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="8"
                  step="0.25"
                  value={slide.subtitleLetterSpacing ?? 0.3}
                  onChange={(e) =>
                    onUpdateSlide({
                      ...slide,
                      subtitleLetterSpacing: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>Tett (-2px)</span>
                  <span>Normal (0.3px)</span>
                  <span>Bred (+8px)</span>
                </div>
              </div>

              {/* 3. Brødtekst / Sitater / Kilde Slider */}
              <div className="space-y-1.5 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-800">Brødtekst, Sitater & Kilde</span>
                  <span className="font-mono text-xs font-bold text-stone-700 bg-white px-2 py-0.5 rounded border border-stone-300">
                    {(slide.bodyLetterSpacing ?? 0.1).toFixed(1)} px
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="6"
                  step="0.25"
                  value={slide.bodyLetterSpacing ?? 0.1}
                  onChange={(e) =>
                    onUpdateSlide({
                      ...slide,
                      bodyLetterSpacing: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>Tett (-2px)</span>
                  <span>Normal (0.1px)</span>
                  <span>Bred (+6px)</span>
                </div>
              </div>

              {/* Bruk på alle slides */}
              {project && onUpdateProject && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const tSpacing = slide.titleLetterSpacing ?? 0.5;
                      const sSpacing = slide.subtitleLetterSpacing ?? 0.3;
                      const bSpacing = slide.bodyLetterSpacing ?? 0.1;
                      const updatedSlides = project.slides.map((s) => ({
                        ...s,
                        titleLetterSpacing: tSpacing,
                        subtitleLetterSpacing: sSpacing,
                        bodyLetterSpacing: bSpacing,
                      }));
                      onUpdateProject({
                        ...project,
                        slides: updatedSlides,
                        titleLetterSpacing: tSpacing,
                        subtitleLetterSpacing: sSpacing,
                        bodyLetterSpacing: bSpacing,
                      });
                      setAppliedSpacingNotice(true);
                      setTimeout(() => setAppliedSpacingNotice(false), 3000);
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    <span>Bruk bokstavavstand på alle slides</span>
                  </button>
                  {appliedSpacingNotice && (
                    <p className="text-[11px] text-emerald-700 font-medium text-center mt-1.5">
                      ✓ Bokstavavstand er nå oppdatert på alle slides!
                    </p>
                  )}
                </div>
              )}
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
