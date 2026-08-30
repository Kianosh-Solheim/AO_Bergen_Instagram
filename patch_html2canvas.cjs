const fs = require('fs');

const code = `import React, { useState } from 'react';
import { Slide, CarouselProject } from '../types';
import { CanvasSlide } from './CanvasSlide';
import html2canvas from 'html2canvas';
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
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImageSuccess, setCopiedImageSuccess] = useState(false);
  const [resolution, setResolution] = useState<'1080' | '2160'>('1080');
  
  // For visual step-by-step export
  const [exportRenderIndex, setExportRenderIndex] = useState<number | null>(null);

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(
        \`\${project.caption}\\n\\n\${project.hashtags}\`
      );
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownloadSingle = async () => {
    const exportSlide = document.getElementById(\`export-slide-\${activeSlideIndex}\`);
    if (!exportSlide) return;
    
    setIsExportingSingle(true);
    try {
      const scale = resolution === '2160' ? 4 : 2;
      
      const canvas = await html2canvas(exportSlide, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const exportResult = canvas.toDataURL('image/png', 0.98);

      const link = document.createElement('a');
      link.download = \`slide_\${activeSlideIndex + 1}_\${currentSlide.title?.slice(0, 20).replace(/[^a-z0-9]/gi, '_') || 'eksport'}.png\`;
      link.href = exportResult;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExportSuccess) onExportSuccess();
    } catch (err: any) {
      console.error('Kunne ikke eksportere:', err);
      alert('Eksport feilet!\\nTeknisk feil: ' + (err?.message || String(err)));
    } finally {
      setIsExportingSingle(false);
    }
  };

  const handleCopyImage = async () => {
    const exportSlide = document.getElementById(\`export-slide-\${activeSlideIndex}\`);
    if (!exportSlide) return;

    setIsCopyingImage(true);
    try {
      const scale = resolution === '2160' ? 4 : 2;
      
      const canvas = await html2canvas(exportSlide, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 0.98);
      });

      if (!blob) throw new Error('Kunne ikke generere bilde blob');
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      setCopiedImageSuccess(true);
      setTimeout(() => setCopiedImageSuccess(false), 3000);
    } catch (err: any) {
      console.error('Kopiering feilet:', err);
      alert('Kunne ikke kopiere bildet. Sjekk at nettleseren din støtter utklippstavle-kopiering av bilder.');
    } finally {
      setIsCopyingImage(false);
    }
  };

  const handleDownloadAllZip = async () => {
    setIsExportingAll(true);
    try {
      const zip = new JSZip();
      const scale = resolution === '2160' ? 4 : 2;
      
      for (let i = 0; i < project.slides.length; i++) {
        setExportRenderIndex(i);
        // Vent lenger slik at nettleseren garantert rekker å laste nye bilder visuelt
        await new Promise(r => setTimeout(r, 1200));

        const slideElement = document.getElementById(\`active-export-slide\`);
        if (!slideElement) continue;

        const canvas = await html2canvas(slideElement, {
          scale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false
        });

        const currentDataUrl = canvas.toDataURL('image/png', 0.98);
        const base64Data = currentDataUrl.split(',')[1];
        const currentSlide = project.slides[i];
        const fileName = \`slide_\${String(i + 1).padStart(2, '0')}_\${(
          currentSlide.title || currentSlide.preset
        )
          .slice(0, 20)
          .replace(/[^a-z0-9]/gi, '_')}.png\`;
        
        zip.file(fileName, base64Data, { base64: true });
      }

      // Add text caption file
      const captionText = \`\${project.caption}\\n\\n\${project.hashtags}\`;
      zip.file('instagram_caption.txt', captionText);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = \`\${project.title.replace(/[^a-z0-9]/gi, '_')}_instagram_export.zip\`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (onExportSuccess) {
        onExportSuccess();
      }
    } catch (err: any) {
      console.error('Kunne ikke lage ZIP:', err);
      let errMsg = err?.message || String(err);
      if (err instanceof Event) {
        errMsg = "CORS-blokkering eller nettverksfeil ved nedlasting av bilde (Event)";
      }
      alert('Eksport feilet (ZIP)!\\n\\nDette skjer ofte pga beskyttede bilder.\\nTeknisk feil: ' + errMsg);
    } finally {
      setIsExportingAll(false);
      setExportRenderIndex(null);
    }
  };

  const currentSlide = project.slides[activeSlideIndex];

  // ==========================================
  // FULL SCREEN EXPORT LOADING VIEW
  // ==========================================
  if (isExportingAll && exportRenderIndex !== null) {
    const slideToRender = project.slides[exportRenderIndex];
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-stone-900/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
        <div className="text-white text-center mb-8">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <h2 className="text-3xl font-bold tracking-tight">Lager ZIP-fil...</h2>
          <p className="text-stone-300 mt-2 text-lg font-medium">
            Eksporterer bilde {exportRenderIndex + 1} av {project.slides.length}
          </p>
        </div>
        
        {/* We use scale-75 so it fits neatly on screen, but html2canvas exports it at full 540x675 */}
        <div className="relative border-2 border-stone-600 rounded-xl overflow-hidden shadow-2xl transition-all scale-75 sm:scale-90 origin-top">
          <div key={\`export-render-key-\${exportRenderIndex}\`} id="active-export-slide" style={{ width: '540px', height: '675px' }} className="bg-white">
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
                className={\`px-3 py-1 rounded-md transition-all \${
                  resolution === '1080'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }\`}
              >
                1080×1350 (Standard)
              </button>
              <button
                type="button"
                onClick={() => setResolution('2160')}
                className={\`px-3 py-1 rounded-md transition-all \${
                  resolution === '2160'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }\`}
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
      
      {/* Fallback container for single slide export if needed */}
      {!isExportingAll && (
        <div style={{ position: 'fixed', left: '-10000px', top: '-10000px', pointerEvents: 'none' }}>
           <div id={\`export-slide-\${activeSlideIndex}\`} style={{ width: '540px', height: '675px' }} className="bg-white">
              <CanvasSlide
                slide={project.slides[activeSlideIndex]}
                showPurpleGuide={false}
                showInstagramUi={false}
                instagramHandle={project.instagramHandle}
                instagramLocation={project.instagramLocation}
                scale={1}
                interactive={false}
              />
            </div>
        </div>
      )}
    </div>
  );
};
`
fs.writeFileSync('src/components/ExportModal.tsx', code);
