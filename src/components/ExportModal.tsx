import React, { useState } from 'react';
import { Slide, CarouselProject } from '../types';
import { toPng, toBlob } from 'html-to-image';
import JSZip from 'jszip';
import {
  Download,
  Copy,
  Check,
  FileArchive,
  Share2,
  X,
  Sparkles,
  Loader2,
  Instagram,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CarouselProject;
  activeSlideIndex: number;
  activeSlideRef: React.RefObject<HTMLDivElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  activeSlideIndex,
  activeSlideRef,
}) => {
  if (!isOpen) return null;

  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImageSuccess, setCopiedImageSuccess] = useState(false);
  const [resolution, setResolution] = useState<'1080' | '2160'>('1080');

  const currentSlide = project.slides[activeSlideIndex];

  // Export current slide as 1080x1350 PNG
  const handleDownloadSingle = async () => {
    if (!activeSlideRef.current) return;
    setIsExportingSingle(true);
    try {
      // The canvas element is 540x675 in DOM preview.
      // pixelRatio 2 makes it exact 1080x1350.
      // pixelRatio 4 makes it ultra 2160x2700.
      const pixelRatio = resolution === '2160' ? 4 : 2;

      const dataUrl = await toPng(activeSlideRef.current, {
        pixelRatio,
        quality: 0.98,
        cacheBust: true,
      });

      const link = document.createElement('a');
      const safeTitle = (currentSlide.title || `slide_${activeSlideIndex + 1}`)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      link.download = `instagram_${safeTitle}_1080x1350.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Kunne ikke eksportere bilde:', err);
    } finally {
      setIsExportingSingle(false);
    }
  };

  // Copy current slide image directly to clipboard
  const handleCopyImage = async () => {
    if (!activeSlideRef.current) return;
    setIsCopyingImage(true);
    try {
      const blob = await toBlob(activeSlideRef.current, {
        pixelRatio: 2,
        quality: 0.95,
      });
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImageSuccess(true);
        setTimeout(() => setCopiedImageSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Kopiering feilet:', err);
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Export entire carousel as a ZIP
  const handleDownloadAllZip = async () => {
    if (!activeSlideRef.current) return;
    setIsExportingAll(true);
    try {
      const zip = new JSZip();
      const pixelRatio = resolution === '2160' ? 4 : 2;

      // Capture currently mounted slide
      const currentDataUrl = await toPng(activeSlideRef.current, {
        pixelRatio,
        quality: 0.98,
      });
      const base64Data = currentDataUrl.split(',')[1];
      const fileName = `slide_${String(activeSlideIndex + 1).padStart(2, '0')}_${(
        currentSlide.title || currentSlide.preset
      )
        .slice(0, 20)
        .replace(/[^a-z0-9]/gi, '_')}.png`;
      zip.file(fileName, base64Data, { base64: true });

      // Add text caption file
      const captionText = `${project.caption}\n\n${project.hashtags}`;
      zip.file('instagram_caption.txt', captionText);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `ao_karusell_${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_1080x1350.zip`;
      link.href = URL.createObjectURL(zipBlob);
      link.click();
    } catch (err) {
      console.error('Kunne ikke lage ZIP:', err);
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleCopyCaption = () => {
    const fullText = `${project.caption}\n\n${project.hashtags}`;
    navigator.clipboard.writeText(fullText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-stone-900 text-lg">
              Eksporter Instagram-innlegg
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Resolution toggle */}
          <div className="flex items-center justify-between p-3 bg-stone-100/80 rounded-xl border border-stone-200">
            <div>
              <p className="text-xs font-bold text-stone-800">
                Størrelse og oppløsning
              </p>
              <p className="text-[11px] text-stone-500">
                Standard 1080×1350 px (4:5 format for Instagram feed)
              </p>
            </div>
            <div className="flex bg-white p-1 rounded-lg border border-stone-300 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setResolution('1080')}
                className={`px-3 py-1 rounded-md transition-all ${
                  resolution === '1080'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                1080×1350 (Standard)
              </button>
              <button
                type="button"
                onClick={() => setResolution('2160')}
                className={`px-3 py-1 rounded-md transition-all ${
                  resolution === '2160'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                2160×2700 (Ultra HD)
              </button>
            </div>
          </div>

          {/* Export Actions Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
              Last ned grafikk
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Download Current Slide */}
              <button
                type="button"
                onClick={handleDownloadSingle}
                disabled={isExportingSingle}
                className="p-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl flex flex-col items-start justify-between text-left shadow-sm transition-all group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="p-2 bg-stone-800 rounded-lg group-hover:bg-purple-600 transition-colors">
                    {isExportingSingle ? (
                      <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-stone-800 px-2 py-0.5 rounded text-stone-300">
                    PNG Bilde
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm">Last ned aktiv slide #{activeSlideIndex + 1}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Høy oppløsning i 1080×1350 format
                  </p>
                </div>
              </button>

              {/* Download All in ZIP */}
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isExportingAll}
                className="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 rounded-xl flex flex-col items-start justify-between text-left transition-all group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <div className="p-2 bg-purple-200 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    {isExportingAll ? (
                      <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    ) : (
                      <FileArchive className="w-5 h-5 text-purple-800 group-hover:text-white" />
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-200/80 px-2 py-0.5 rounded text-purple-900">
                    ZIP Pakke
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm">Last ned karusell ({project.slides.length} slides)</p>
                  <p className="text-[11px] text-purple-800/80 mt-0.5">
                    Alle slides nummerert + bildetekst-fil
                  </p>
                </div>
              </button>
            </div>

            {/* Copy image to clipboard button */}
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isCopyingImage}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedImageSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Bildet er kopiert til utklippstavlen!</span>
                </>
              ) : isCopyingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Kopierer bilde...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopier bilde direkte til utklippstavle (Ctrl+V / Cmd+V)</span>
                </>
              )}
            </button>
          </div>

          {/* Caption & Hashtags Section */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                Instagram Bildetekst & Emneknagger
              </label>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopier tekst</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 font-normal leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
              {project.caption}
              <div className="mt-2 text-purple-700 font-semibold">
                {project.hashtags}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
