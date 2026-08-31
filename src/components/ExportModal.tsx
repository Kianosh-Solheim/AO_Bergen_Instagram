import React, { useState, useRef } from 'react';
import { Slide, CarouselProject } from '../types';
import { CanvasSlide } from './CanvasSlide';
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
  Layers,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CarouselProject;
  activeSlideIndex: number;
  activeSlideRef: React.RefObject<HTMLDivElement | null>;
  onExportSuccess?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  activeSlideIndex,
  activeSlideRef,
  onExportSuccess,
}) => {
  if (!isOpen) return null;

  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [selectedSlideToDownload, setSelectedSlideToDownload] = useState(activeSlideIndex);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isExportingIndividualAll, setIsExportingIndividualAll] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImageSuccess, setCopiedImageSuccess] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'1080' | '2160'>('1080');

  // Currently rendering slide index for export
  const [exportRenderIndex, setExportRenderIndex] = useState<number | null>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(
        `${project.caption}\n\n${project.hashtags}`
      );
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const waitForElementResources = async (element: HTMLElement): Promise<void> => {
    // 1. Wait for document fonts
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Font loading check:', e);
      }
    }

    // 2. Wait for all images inside the element to fully load & decode
    const images = Array.from(element.querySelectorAll('img'));
    if (images.length > 0) {
      await Promise.all(
        images.map(async (img) => {
          if (!img.src) return;
          if (img.complete && img.naturalHeight !== 0) {
            try {
              if (img.decode) await img.decode();
            } catch (e) {
              // Ignore decode errors on tainted images
            }
            return;
          }
          await new Promise<void>((resolve) => {
            const onFinish = async () => {
              try {
                if (img.decode) await img.decode();
              } catch (e) {}
              resolve();
            };
            img.onload = () => onFinish();
            img.onerror = () => resolve();
            // Safety timeout
            setTimeout(resolve, 1500);
          });
        })
      );
    }

    // 3. Small RAF pause to ensure final paint before rasterization
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 60)));
  };

  const renderSlideToDataUrl = async (element: HTMLElement, scale: number): Promise<string> => {
    await waitForElementResources(element);

    return await toPng(element, {
      pixelRatio: scale,
      width: 540,
      height: 675,
      canvasWidth: 540 * scale,
      canvasHeight: 675 * scale,
      backgroundColor: '#ffffff',
      cacheBust: false,
    });
  };

  const renderSlideToBlob = async (element: HTMLElement, scale: number): Promise<Blob | null> => {
    await waitForElementResources(element);

    return await toBlob(element, {
      pixelRatio: scale,
      width: 540,
      height: 675,
      canvasWidth: 540 * scale,
      canvasHeight: 675 * scale,
      backgroundColor: '#ffffff',
      cacheBust: false,
    });
  };

  // Export single slide safely by mounting it in the export container
  const handleDownloadSingle = async (slideIndex = selectedSlideToDownload) => {
    setIsExportingSingle(true);
    setDownloadSuccessMessage(null);
    setExportRenderIndex(slideIndex);

    try {
      // Allow React to mount the single slide cleanly
      await new Promise((r) => setTimeout(r, 200));

      const slideElement = document.getElementById('active-export-slide');
      if (!slideElement) throw new Error('Fant ikke slide-elementet for rendering');

      const scale = resolution === '2160' ? 4 : 2;
      const exportResult = await renderSlideToDataUrl(slideElement, scale);

      const currentSlide = project.slides[slideIndex] || project.slides[0];
      const safeTitle = (currentSlide.title || currentSlide.preset || `slide_${slideIndex + 1}`)
        .slice(0, 25)
        .replace(/[^a-z0-9]/gi, '_');

      const link = document.createElement('a');
      link.download = `slide_${String(slideIndex + 1).padStart(2, '0')}_${safeTitle}.png`;
      link.href = exportResult;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccessMessage(`Slide ${slideIndex + 1} ble lastet ned!`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);

      if (onExportSuccess) onExportSuccess();
    } catch (err: any) {
      console.error('Kunne ikke eksportere slide:', err);
      alert('Eksport feilet!\nTeknisk feil: ' + (err?.message || String(err)));
    } finally {
      setIsExportingSingle(false);
      setExportRenderIndex(null);
    }
  };

  const handleCopyImage = async () => {
    setIsCopyingImage(true);
    setExportRenderIndex(selectedSlideToDownload);

    try {
      await new Promise((r) => setTimeout(r, 200));
      const slideElement = document.getElementById('active-export-slide');
      if (!slideElement) throw new Error('Fant ikke slide');

      const scale = resolution === '2160' ? 4 : 2;
      const blob = await renderSlideToBlob(slideElement, scale);

      if (!blob) throw new Error('Kunne ikke generere bilde-blob');

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      setCopiedImageSuccess(true);
      setTimeout(() => setCopiedImageSuccess(false), 3000);
    } catch (err: any) {
      console.error('Kopiering feilet:', err);
      alert('Kunne ikke kopiere bildet direkte til utklippstavlen. Prøv Last ned PNG i stedet.');
    } finally {
      setIsCopyingImage(false);
      setExportRenderIndex(null);
    }
  };

  const handleDownloadAllZip = async () => {
    setIsExportingAll(true);
    setDownloadSuccessMessage(null);

    try {
      const zip = new JSZip();
      const scale = resolution === '2160' ? 4 : 2;

      for (let i = 0; i < project.slides.length; i++) {
        setExportRenderIndex(i);
        // Wait for React DOM update and assets to initialize
        await new Promise((r) => setTimeout(r, 250));

        const slideElement = document.getElementById('active-export-slide');
        if (!slideElement) continue;

        // Use toBlob directly to conserve RAM and prevent string ballooning
        const blob = await renderSlideToBlob(slideElement, scale);
        if (!blob) continue;

        const currentSlide = project.slides[i];
        const safeSlideName = (currentSlide.title || currentSlide.preset || 'slide')
          .slice(0, 20)
          .replace(/[^a-z0-9]/gi, '_');
        const fileName = `slide_${String(i + 1).padStart(2, '0')}_${safeSlideName}.png`;

        zip.file(fileName, blob);

        // Small pause between slides for browser garbage collection
        await new Promise((r) => setTimeout(r, 100));
      }

      // Add Instagram caption and hashtags text file
      const captionText = `${project.caption}\n\n${project.hashtags}`;
      zip.file('instagram_caption.txt', captionText);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const safeProjectTitle = (project.title || 'karusell').replace(/[^a-z0-9]/gi, '_');
      link.download = `${safeProjectTitle}_instagram_export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setDownloadSuccessMessage(`ZIP-pakke med alle ${project.slides.length} slides er lastet ned!`);
      setTimeout(() => setDownloadSuccessMessage(null), 5000);

      if (onExportSuccess) {
        onExportSuccess();
      }
    } catch (err: any) {
      console.error('Kunne ikke lage ZIP:', err);
      let errMsg = err?.message || String(err);
      if (err instanceof Event) {
        errMsg = 'CORS-blokkering eller nettverksfeil ved nedlasting av bilde';
      }
      alert('Eksport feilet (ZIP)!\nTeknisk feil: ' + errMsg);
    } finally {
      setIsExportingAll(false);
      setExportRenderIndex(null);
    }
  };

  const handleDownloadAllSeparate = async () => {
    setIsExportingIndividualAll(true);
    setDownloadSuccessMessage(null);

    try {
      const scale = resolution === '2160' ? 4 : 2;
      for (let i = 0; i < project.slides.length; i++) {
        setExportRenderIndex(i);
        await new Promise((r) => setTimeout(r, 250));

        const slideElement = document.getElementById('active-export-slide');
        if (!slideElement) continue;

        const exportResult = await renderSlideToDataUrl(slideElement, scale);
        const currentSlide = project.slides[i];
        const safeTitle = (currentSlide.title || currentSlide.preset || 'slide')
          .slice(0, 20)
          .replace(/[^a-z0-9]/gi, '_');

        const link = document.createElement('a');
        link.download = `slide_${String(i + 1).padStart(2, '0')}_${safeTitle}.png`;
        link.href = exportResult;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Pause between each file download so browser download queue processes smoothly
        await new Promise((r) => setTimeout(r, 350));
      }

      setDownloadSuccessMessage(`Alle ${project.slides.length} slides ble lastet ned!`);
      setTimeout(() => setDownloadSuccessMessage(null), 5000);

      if (onExportSuccess) onExportSuccess();
    } catch (err: any) {
      console.error('Kunne ikke laste ned separate bilder:', err);
      alert('Eksport feilet!\nTeknisk feil: ' + (err?.message || String(err)));
    } finally {
      setIsExportingIndividualAll(false);
      setExportRenderIndex(null);
    }
  };

  const isAnyExporting = isExportingSingle || isExportingAll || isExportingIndividualAll || isCopyingImage;

  // ==========================================
  // FULL SCREEN EXPORT PROGRESS VIEW
  // ==========================================
  if (isAnyExporting && exportRenderIndex !== null) {
    const slideToRender = project.slides[exportRenderIndex];
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-stone-900/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="text-white text-center mb-6 max-w-sm">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-purple-400" />
          <h2 className="text-2xl font-bold tracking-tight">
            {isExportingAll
              ? 'Pakker karusell til ZIP...'
              : isExportingIndividualAll
              ? 'Laster ned slides...'
              : isCopyingImage
              ? 'Kopierer bilde...'
              : 'Eksporterer slide...'}
          </h2>
          <p className="text-stone-300 mt-1 text-sm font-medium">
            Rendrer slide {exportRenderIndex + 1} av {project.slides.length}
          </p>

          {/* Progress bar */}
          <div className="w-64 bg-stone-700 h-2 rounded-full mx-auto mt-3 overflow-hidden">
            <div
              className="bg-purple-500 h-full transition-all duration-300 rounded-full"
              style={{
                width: `${((exportRenderIndex + 1) / project.slides.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Live single active render container at exact 540x675 */}
        <div className="relative border-2 border-stone-600 rounded-xl overflow-hidden shadow-2xl transition-all scale-75 sm:scale-90 origin-top">
          <div
            key={`export-render-${slideToRender.id}-${exportRenderIndex}`}
            id="active-export-slide"
            style={{ width: '540px', height: '675px' }}
            className="bg-white"
          >
            <CanvasSlide
              slide={slideToRender}
              showPurpleGuide={false}
              showInstagramUi={false}
              instagramHandle={project.instagramHandle}
              instagramLocation={project.instagramLocation}
              scale={1}
              interactive={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // NORMAL MODAL VIEW
  // ==========================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Share2 className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Eksportér Karusell</h2>
              <p className="text-xs text-stone-500 font-medium">{project.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {downloadSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{downloadSuccessMessage}</span>
            </div>
          )}

          {/* Resolution Options */}
          <div className="p-4 bg-stone-100 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
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
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  resolution === '2160'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                2160×2700 (Ultra HD)
              </button>
            </div>
          </div>

          {/* Slide selector tabs for single download */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                Velg slide å laste ned
              </label>
              <span className="text-[11px] text-stone-500 font-medium">
                Slide {selectedSlideToDownload + 1} av {project.slides.length}
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {project.slides.map((s, idx) => (
                <button
                  key={s.id || idx}
                  type="button"
                  onClick={() => setSelectedSlideToDownload(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedSlideToDownload === idx
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                  }`}
                >
                  #{idx + 1} {s.title ? `(${s.title.slice(0, 10)}...)` : s.preset}
                </button>
              ))}
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
                onClick={() => handleDownloadSingle(selectedSlideToDownload)}
                disabled={isAnyExporting}
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
                  <p className="font-bold text-sm">
                    Last ned slide #{selectedSlideToDownload + 1}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Høy oppløsning {resolution === '2160' ? '2160×2700' : '1080×1350'} format
                  </p>
                </div>
              </button>

              {/* Download All in ZIP */}
              <button
                type="button"
                onClick={handleDownloadAllZip}
                disabled={isAnyExporting}
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
                  <p className="font-bold text-sm">
                    Last ned karusell ({project.slides.length} slides)
                  </p>
                  <p className="text-[11px] text-purple-800/80 mt-0.5">
                    Alle slides nummerert + bildetekst-fil
                  </p>
                </div>
              </button>
            </div>

            {/* Secondary action row: Copy image & Download all separately */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyImage}
                disabled={isAnyExporting}
                className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {copiedImageSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Slide kopiert!</span>
                  </>
                ) : isCopyingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
                    <span>Kopierer bilde...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-stone-600" />
                    <span>Kopier slide #{selectedSlideToDownload + 1} til utklipp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadAllSeparate}
                disabled={isAnyExporting}
                className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold border border-stone-300 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isExportingIndividualAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span>Laster ned alle...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-purple-600" />
                    <span>Last ned alle ({project.slides.length}) som enkeltfiler</span>
                  </>
                )}
              </button>
            </div>
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
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
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
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 font-normal leading-relaxed whitespace-pre-line max-h-32 overflow-y-auto">
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
            className="px-5 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 cursor-pointer"
          >
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};
