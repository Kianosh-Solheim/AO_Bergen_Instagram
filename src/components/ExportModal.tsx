import React, { useState, useEffect } from 'react';
import { Slide, CarouselProject } from '../types';
import { CanvasSlide } from './CanvasSlide';
import { toBlob } from 'html-to-image';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import {
  Download,
  Copy,
  Check,
  FileArchive,
  Share2,
  X,
  Loader2,
  Instagram,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CarouselProject;
  activeSlideIndex: number;
  activeSlideRef?: React.RefObject<HTMLDivElement | null>;
  onExportSuccess?: () => void;
}

// Convert any remote or local URL into a base64 Data URL to guarantee 0 CORS & 0 race conditions during rendering
async function preloadAndConvertImage(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  const proxyUrl =
    (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('wsrv.nl')
      ? `https://wsrv.nl/?url=${encodeURIComponent(url)}`
      : url;

  try {
    const response = await fetch(proxyUrl, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Direct fetch/convert failed for URL:', url, err);
    // Fallback: draw image into an offscreen canvas
    try {
      return await new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 800;
            canvas.height = img.naturalHeight || 800;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
              return;
            }
          } catch (e) {
            console.warn('Canvas conversion fallback failed:', e);
          }
          resolve(proxyUrl);
        };
        img.onerror = () => resolve(proxyUrl);
        img.src = proxyUrl;
      });
    } catch {
      return proxyUrl;
    }
  }
}

// Deeply inlines all images within a slide before mounting to the export stage
async function prepareSlideForExport(slide: Slide): Promise<Slide> {
  const preparedImages = await Promise.all(
    (slide.images || []).map(async (img) => {
      if (!img.url) return img;
      const dataUrl = await preloadAndConvertImage(img.url);
      return {
        ...img,
        url: dataUrl,
      };
    })
  );
  return {
    ...slide,
    images: preparedImages,
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  activeSlideIndex,
  onExportSuccess,
}) => {
  const [selectedSlideToDownload, setSelectedSlideToDownload] = useState(activeSlideIndex);
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isExportingIndividualAll, setIsExportingIndividualAll] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImageSuccess, setCopiedImageSuccess] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [resolution, setResolution] = useState<'1080' | '2160'>('1080');

  // Export progress indicators
  const [exportProgressIndex, setExportProgressIndex] = useState<number | null>(null);
  const [exportProgressText, setExportProgressText] = useState<string>('');

  // Single-slot dedicated export stage to eliminate memory spikes and image bleed across slides
  const [stageSlide, setStageSlide] = useState<{
    slide: Slide;
    id: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedSlideToDownload(activeSlideIndex);
    }
  }, [isOpen, activeSlideIndex]);

  if (!isOpen) return null;

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

  // High-reliability slide capture engine with fallback
  const captureSlideAsBlob = async (targetSlide: Slide, scale: number): Promise<Blob | null> => {
    // 1. Inline all images in the slide to ensure pure local memory data
    const preparedSlide = await prepareSlideForExport(targetSlide);

    // 2. Mount slide into dedicated stage
    setStageSlide({ slide: preparedSlide, id: targetSlide.id });

    // 3. Allow React commit and paint
    await new Promise((r) => setTimeout(r, 60));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 4. Ensure document web fonts are loaded
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn('Font loading check:', e);
      }
    }

    const stageElement = document.getElementById('export-live-slide');
    if (!stageElement) {
      throw new Error(`Export staging element ble ikke funnet.`);
    }

    // 5. Ensure all images in stage element are decoded
    const imgs = Array.from(stageElement.querySelectorAll('img'));
    if (imgs.length > 0) {
      await Promise.all(
        imgs.map(async (img) => {
          if (!img.src) return;
          if (img.complete && img.naturalWidth > 0) {
            try {
              if (img.decode) await img.decode();
            } catch {}
            return;
          }
          await new Promise<void>((resolve) => {
            img.onload = async () => {
              try {
                if (img.decode) await img.decode();
              } catch {}
              resolve();
            };
            img.onerror = () => resolve();
            setTimeout(resolve, 2000);
          });
        })
      );
    }

    // Final render frame
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 6. Attempt Primary Renderer (html-to-image)
    try {
      const blob = await toBlob(stageElement, {
        pixelRatio: scale,
        width: 540,
        height: 675,
        canvasWidth: 540 * scale,
        canvasHeight: 675 * scale,
        backgroundColor: targetSlide.bgColor || '#ffffff',
        cacheBust: false,
      });
      if (blob) return blob;
    } catch (err) {
      console.warn('Primary html-to-image capture failed, trying html2canvas fallback:', err);
    }

    // 7. Secondary Fallback Renderer (html2canvas)
    try {
      const canvas = await html2canvas(stageElement, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: targetSlide.bgColor || '#ffffff',
        width: 540,
        height: 675,
        logging: false,
      });
      return await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });
    } catch (err2) {
      console.error('html2canvas fallback failed:', err2);
      throw err2;
    }
  };

  // Export single slide directly from dedicated live stage
  const handleDownloadSingle = async (slideIndex = selectedSlideToDownload) => {
    setIsExportingSingle(true);
    setExportProgressIndex(slideIndex);
    setExportProgressText(`Rendrer slide ${slideIndex + 1}...`);
    setDownloadSuccessMessage(null);
    const targetSlide = project.slides[slideIndex] || project.slides[0];

    try {
      const scale = resolution === '2160' ? 4 : 2;
      const blob = await captureSlideAsBlob(targetSlide, scale);
      if (!blob) throw new Error('Kunne ikke generere bilde-blob');

      const safeTitle = (targetSlide.title || targetSlide.preset || `slide_${slideIndex + 1}`)
        .slice(0, 25)
        .replace(/[^a-z0-9]/gi, '_');

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `slide_${String(slideIndex + 1).padStart(2, '0')}_${safeTitle}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setDownloadSuccessMessage(`Slide ${slideIndex + 1} ble lastet ned!`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);

      if (onExportSuccess) onExportSuccess();
    } catch (err: any) {
      console.error('Kunne ikke eksportere slide:', err);
      alert('Eksport feilet!\nTeknisk feil: ' + (err?.message || String(err)));
    } finally {
      setIsExportingSingle(false);
      setExportProgressIndex(null);
      setExportProgressText('');
      setStageSlide(null);
    }
  };

  const handleCopyImage = async () => {
    setIsCopyingImage(true);
    const targetSlide = project.slides[selectedSlideToDownload] || project.slides[0];

    try {
      const scale = 2;
      const blob = await captureSlideAsBlob(targetSlide, scale);
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
      setStageSlide(null);
    }
  };

  const handleDownloadAllZip = async () => {
    setIsExportingAll(true);
    setDownloadSuccessMessage(null);

    try {
      const zip = new JSZip();
      const scale = resolution === '2160' ? 4 : 2;

      for (let i = 0; i < project.slides.length; i++) {
        setExportProgressIndex(i);
        setExportProgressText(`Rendrer slide ${i + 1} av ${project.slides.length}...`);

        const targetSlide = project.slides[i];
        const blob = await captureSlideAsBlob(targetSlide, scale);
        if (!blob) continue;

        const safeSlideName = (targetSlide.title || targetSlide.preset || 'slide')
          .slice(0, 20)
          .replace(/[^a-z0-9]/gi, '_');
        const fileName = `slide_${String(i + 1).padStart(2, '0')}_${safeSlideName}.png`;

        zip.file(fileName, blob);

        // Pause between slides for browser garbage collection and responsive UI
        await new Promise((r) => setTimeout(r, 80));
      }

      setExportProgressText('Pakker ZIP-fil...');

      // Add Instagram caption and hashtags text file
      const captionText = `${project.caption}\n\n${project.hashtags}`;
      zip.file('instagram_caption.txt', captionText);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE',
      });

      const blobUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const safeProjectTitle = (project.title || 'karusell').replace(/[^a-z0-9]/gi, '_');
      link.download = `${safeProjectTitle}_instagram_export.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

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
      setExportProgressIndex(null);
      setExportProgressText('');
      setStageSlide(null);
    }
  };

  const handleDownloadAllSeparate = async () => {
    setIsExportingIndividualAll(true);
    setDownloadSuccessMessage(null);

    try {
      const scale = resolution === '2160' ? 4 : 2;
      for (let i = 0; i < project.slides.length; i++) {
        setExportProgressIndex(i);
        setExportProgressText(`Laster ned slide ${i + 1} av ${project.slides.length}...`);

        const targetSlide = project.slides[i];
        const blob = await captureSlideAsBlob(targetSlide, scale);
        if (!blob) continue;

        const safeTitle = (targetSlide.title || targetSlide.preset || 'slide')
          .slice(0, 20)
          .replace(/[^a-z0-9]/gi, '_');

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `slide_${String(i + 1).padStart(2, '0')}_${safeTitle}.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        // Pause between each file download so browser download manager processes smoothly
        await new Promise((r) => setTimeout(r, 250));
      }

      setDownloadSuccessMessage(`Alle ${project.slides.length} slides ble lastet ned!`);
      setTimeout(() => setDownloadSuccessMessage(null), 5000);

      if (onExportSuccess) onExportSuccess();
    } catch (err: any) {
      console.error('Kunne ikke laste ned separate bilder:', err);
      alert('Eksport feilet!\nTeknisk feil: ' + (err?.message || String(err)));
    } finally {
      setIsExportingIndividualAll(false);
      setExportProgressIndex(null);
      setExportProgressText('');
      setStageSlide(null);
    }
  };

  const isAnyExporting = isExportingSingle || isExportingAll || isExportingIndividualAll || isCopyingImage;

  return (
    <>
      {/* ========================================================================= */}
      {/* BULLETPROOF LIVE EXPORT STAGE (Always in DOM layout, 100% opacity, zIndex -100) */}
      {/* ========================================================================= */}
      <div
        id="export-live-stage-root"
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '540px',
          height: '675px',
          zIndex: -100,
          pointerEvents: 'none',
          opacity: 1,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        {stageSlide && (
          <div
            id="export-live-slide"
            key={`live-stage-${stageSlide.id}`}
            style={{
              width: '540px',
              height: '675px',
              backgroundColor: stageSlide.slide.bgColor || '#fffdf7',
            }}
          >
            <CanvasSlide
              slide={stageSlide.slide}
              showPurpleGuide={false}
              showInstagramUi={false}
              instagramHandle={project.instagramHandle}
              instagramLocation={project.instagramLocation}
              scale={1}
              interactive={false}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* EXPORT PROGRESS OVERLAY */}
      {/* ========================================================================= */}
      {isAnyExporting && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-stone-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="text-white text-center max-w-sm">
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
              {exportProgressText || `Behandler slide ${(exportProgressIndex ?? 0) + 1} av ${project.slides.length}`}
            </p>

            {/* Progress bar */}
            <div className="w-64 bg-stone-700 h-2 rounded-full mx-auto mt-4 overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${(((exportProgressIndex ?? 0) + 1) / project.slides.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NORMAL EXPORT MODAL DIALOG */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
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
    </>
  );
};
