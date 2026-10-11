import React, { useState } from 'react';
import {
  Download,
  Sparkles,
  CheckCircle2,
  X,
  Smartphone,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Wheat,
  Building2,
  Zap,
  Volume2
} from 'lucide-react';
import { useJoinerApp } from '../JoinerAppContext';

export const AppUpdateModal: React.FC = () => {
  const { isUpdateModalOpen, setIsUpdateModalOpen, playNotificationSound, notifications } = useJoinerApp();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!isUpdateModalOpen) return null;

  const newVersion = 'v2.7.0';
  const releaseDate = 'Today, 11 Oct 2026';
  const apkFileName = 'farmerbox.apk';

  const handleClose = () => {
    setIsUpdateModalOpen(false);
    const updateNotif = notifications.find(n => n.title.toLowerCase().includes('update') || n.title.toLowerCase().includes('app update'));
    if (updateNotif && typeof window !== 'undefined') {
      localStorage.setItem('farmerbox_dismissed_update', updateNotif.id);
    }
  };

  const handleStartUpdate = () => {
    playNotificationSound('pop');
    setDownloadProgress(10);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev === null) return 10;
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloaded(true);
          playNotificationSound('commission');
          // Trigger actual APK file download
          const link = document.createElement('a');
          link.href = `/${apkFileName}`;
          link.download = apkFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-emerald-500/20 flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Hero Gradient */}
        <div className="bg-gradient-to-br from-[#15803d] via-emerald-600 to-teal-700 p-5 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none blur-sm"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shadow-md shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 fill-slate-950" /> Update Available
                </span>
                <h3 className="text-lg font-black text-white leading-tight mt-1">
                  FarmerBox Joiner {newVersion}
                </h3>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-emerald-100 font-medium mt-2 relative z-10">
            Release Date: {releaseDate} • Fast & Seamless Upgrade
          </p>
        </div>

        {/* What's New Feature Highlights */}
        <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            What's New in this Version:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold">
                <Wheat className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-emerald-950 text-xs">Dal & Pulses Category</h4>
                <p className="text-[10.5px] text-slate-600 leading-tight mt-0.5">
                  Full pulses catalog (Toor, Moong, Chana, Urad, Rajma) with live count badges.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-blue-950 text-xs">Hotel Active / Inactive Toggle</h4>
                <p className="text-[10.5px] text-slate-600 leading-tight mt-0.5">
                  Easily switch hotel status directly from the My Hotels card with 1-tap.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-purple-50/70 border border-purple-200/70 rounded-xl flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 font-bold">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-black text-purple-950 text-xs">Instant Reorder & Audio Chimes</h4>
                <p className="text-[10.5px] text-slate-600 leading-tight mt-0.5">
                  Accurate total calculation, high-res produce photos and enhanced notification audio.
                </p>
              </div>
            </div>
          </div>

          {/* Download Progress or Ready Status */}
          {downloadProgress !== null && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 flex items-center gap-1.5">
                  {isDownloaded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                  )}
                  {isDownloaded ? 'Update APK Downloaded!' : 'Downloading Update...'}
                </span>
                <span className="text-emerald-800 font-mono font-black">{downloadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              {isDownloaded && (
                <p className="text-[10px] text-emerald-800 font-bold text-center mt-1">
                  Tap the downloaded APK file to install update.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            Later
          </button>

          <button
            onClick={handleStartUpdate}
            disabled={downloadProgress !== null && downloadProgress < 100}
            className="flex-[2] py-2.5 px-4 bg-[#15803d] hover:bg-[#166534] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDownloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Re-Download APK</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-white" />
                <span>Update Now ({newVersion})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
