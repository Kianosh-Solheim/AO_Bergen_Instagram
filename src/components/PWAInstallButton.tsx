import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'floating' | 'banner' | 'menu';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // If already installed in standalone mode, do not show install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowInfoModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-sm transition-all whitespace-nowrap active:scale-95 cursor-pointer"
          title="Installer AO Instagram Malbygger som mobilapp (PWA)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Installer app</span>
          <span className="sm:hidden">App</span>
        </button>
      )}

      {variant === 'floating' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="fixed bottom-20 left-4 z-40 md:hidden flex items-center gap-2 px-3 py-2 bg-stone-900/95 text-white rounded-full text-xs font-bold shadow-xl border border-stone-700/80 backdrop-blur-md active:scale-95 transition-all"
        >
          <Smartphone className="w-4 h-4 text-purple-400" />
          <span>Installer app</span>
        </button>
      )}

      {variant === 'menu' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 flex items-center gap-3 font-semibold text-stone-800 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-xs text-stone-900">Installer som mobilapp</div>
            <div className="text-[11px] text-stone-500">Rask tilgang direkte fra hjemskjermen</div>
          </div>
        </button>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-black text-xs">
                  AO
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">Installer på iPhone/iPad</h3>
                  <p className="text-[11px] text-stone-500">Bruk appen i fullskjerm uten nettleserlinjer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-xs text-stone-700">
              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-900">Trykk på «Del»-knappen</p>
                  <p className="text-stone-600 text-[11px] mt-0.5 flex items-center gap-1">
                    Firkanten med pil opp <Share className="w-3.5 h-3.5 inline text-blue-500" /> nederst i Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-900">Velg «Legg til på Hjem-skjerm»</p>
                  <p className="text-stone-600 text-[11px] mt-0.5 flex items-center gap-1">
                    Scroll litt ned i menyen og trykk <PlusSquare className="w-3.5 h-3.5 inline text-stone-700" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-900">Trykk «Legg til» øverst til høyre</p>
                  <p className="text-stone-600 text-[11px] mt-0.5">
                    App-ikonet legges rett på hjemskjermen din med ett trykk!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors text-center"
            >
              Skjønner, lukk
            </button>
          </div>
        </div>
      )}

      {/* General / Android info modal if browser prompt is suppressed */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-stone-200 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-black text-xs">
                  AO
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-stone-900">Installer AO Malbygger</h3>
                  <p className="text-[11px] text-stone-500">Kjør som frittstående app på enheten din</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-stone-700">
              <p>
                Du kan installere denne nettsiden som en applikasjon på telefonen, nettbrettet eller datamaskinen din.
              </p>
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 space-y-1.5 text-purple-900">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Slik gjør du det i nettleseren:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Trykk på nettleserens meny (de tre prikkene <strong>⋮</strong> i Chrome/Edge) og velg <strong>«Installer app»</strong> eller <strong>«Legg til på startsiden»</strong>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors text-center"
            >
              Lukk
            </button>
          </div>
        </div>
      )}
    </>
  );
};
