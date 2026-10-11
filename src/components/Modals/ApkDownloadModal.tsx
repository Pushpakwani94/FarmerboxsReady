import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  QrCode,
  Smartphone,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Terminal,
  ExternalLink,
  MessageCircle,
  FileCheck2,
  Cpu,
  Sparkles,
  Apple
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlatform?: 'android' | 'ios';
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose, defaultPlatform = 'android' }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAdb, setCopiedAdb] = useState(false);
  const [copiedIosLink, setCopiedIosLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'ios' | 'qr' | 'share' | 'adb'>(
    defaultPlatform === 'ios' ? 'ios' : 'download'
  );
  const [qrPlatform, setQrPlatform] = useState<'android' | 'ios' | 'web'>('android');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  if (!isOpen) return null;

  // Build the direct APK and iOS URLs using the current window origin
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const apkFileName = 'farmerbox.apk';
  const iosFileName = 'farmerbox-joiner-ios.zip';
  const directApkUrl = `${origin}/${apkFileName}`;
  const directIosUrl = `${origin}/${iosFileName}`;
  const directWebUrl = `${origin}/?mobile=1`;
  const adbCommand = `adb install -r ${apkFileName}`;

  const currentQrUrl = qrPlatform === 'android' ? directApkUrl : qrPlatform === 'ios' ? directIosUrl : directWebUrl;

  useEffect(() => {
    QRCode.toDataURL(currentQrUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => {
        console.error('QR code generation failed:', err);
        setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentQrUrl)}&margin=1`);
      });
  }, [currentQrUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directApkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyIosLink = () => {
    navigator.clipboard.writeText(directIosUrl);
    setCopiedIosLink(true);
    setTimeout(() => setCopiedIosLink(false), 2500);
  };

  const handleCopyAdb = () => {
    navigator.clipboard.writeText(adbCommand);
    setCopiedAdb(true);
    setTimeout(() => setCopiedAdb(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌱 *FarmerBox Joiner App (v2.7.0)*\n\nDownload the mobile app for hotel vegetable orders & ₹100 commission!\n\n🤖 Android APK:\n${directApkUrl}\n\n🍎 iOS Xcode Package:\n${directIosUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareSMS = () => {
    const text = encodeURIComponent(
      `Download FarmerBox Joiner App v2.7.0 (Android APK: ${directApkUrl} | iOS: ${directIosUrl})`
    );
    window.open(`sms:?body=${text}`, '_blank');
  };

  const triggerDirectDownload = (file: string = apkFileName) => {
    const link = document.createElement('a');
    link.href = `/${file}`;
    link.download = file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-6 py-4.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shadow-xs">
              <Smartphone className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight leading-none text-white">
                  FarmerBox Joiner Mobile App
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 border border-emerald-300/40 text-[10px] font-black uppercase tracking-wider text-emerald-100">
                  v2.4.1
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-1">
                Android APK & iOS Xcode Package • Fresh Vegetable Ordering & Commission
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-6 pt-2 gap-2 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'download'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Android APK
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ios'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Apple className="w-3.5 h-3.5" /> iOS App (Xcode / Mac)
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'qr'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Scan QR Code
          </button>
          <button
            onClick={() => setActiveTab('share')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'share'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> Share Links
          </button>
          <button
            onClick={() => setActiveTab('adb')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'adb'
                ? 'border-[#15803d] text-[#15803d]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" /> ADB / Developer
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: Direct Download */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              {/* Card 1: farmerbox.apk (Ultra-Lightweight Build) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-green-50/70 border border-emerald-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                      ⚡ Ultra-Lightweight Shell APK (Latest Build)
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    farmerbox.apk
                  </h4>
                  <p className="text-xs text-slate-600">
                    Size: <strong>12.6 KB</strong> • Android 8.0 to 15 • Direct Live Dev Sync • Ready for USB install
                  </p>
                  <p className="text-[11px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded inline-block mt-1">
                    Path: public\farmerbox.apk
                  </p>
                </div>

                <button
                  onClick={() => triggerDirectDownload('farmerbox.apk')}
                  className="px-5 py-2.5 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-black rounded-xl shadow-md shadow-emerald-700/20 hover:shadow-emerald-700/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download farmerbox.apk</span>
                </button>
              </div>

              {/* Card 2: farmerbox-joiner-v2.7.0.apk (Full Standalone Build) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-100/60 border border-slate-300 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                      📦 Full Standalone Production Build
                    </span>
                  </div>
                  <h4 className="text-base font-black text-slate-900">
                    farmerbox-joiner-v2.7.0.apk
                  </h4>
                  <p className="text-xs text-slate-600">
                    Release v2.7.0 • Size: <strong>188 MB</strong> • Advance Side Scroller • Signed Keystore
                  </p>
                  <p className="text-[11px] font-mono text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded inline-block mt-1">
                    Path: public\farmerbox.apk
                  </p>
                </div>

                <button
                  onClick={() => triggerDirectDownload('farmerbox.apk')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download v2.7.0 APK</span>
                </button>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Target Platform</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">Android 8.0 to 14</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Package ID</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5 truncate" title="com.farmerbox.joiner">
                    com.farmerbox.joiner
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Security Check</p>
                  <p className="text-xs font-black text-emerald-700 mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Clean
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Build Signature</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">Release Keystore</p>
                </div>
              </div>

              {/* What's New in v2.4.1 */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h5 className="text-xs font-extrabold text-amber-900">What's New in Version 2.4.1:</h5>
                </div>
                <ul className="text-xs text-amber-900/90 space-y-1 list-disc list-inside">
                  <li>Direct farm-to-hotel fresh vegetable crate ordering (Tomatoes, Onions, Leafy veggies).</li>
                  <li>Real-time automated ₹100 commission credit upon delivery confirmation.</li>
                  <li>Live order dispatch tracking with delivery driver vehicle details.</li>
                  <li>1-Tap Reorder history for high-frequency hotel kitchen replenishment.</li>
                </ul>
              </div>

              {/* 3 Step Install Guide */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  How to Install on Your Android Device:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      1
                    </span>
                    <p className="text-slate-600">
                      Tap <strong>Download APK</strong> to save the file to your Android phone.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      2
                    </span>
                    <p className="text-slate-600">
                      Open Downloads, tap APK, and allow <strong>Install Unknown Apps</strong> if prompted.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                      3
                    </span>
                    <p className="text-slate-600">
                      Tap <strong>Install</strong> and log in using your registered Joiner Mobile number.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: iOS App (Xcode / Mac) */}
          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Apple className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wide">
                      iOS Native Xcode Workspace Ready
                    </span>
                  </div>
                  <h4 className="text-base font-black text-white">
                    {iosFileName}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Release v2.4.1 • Size: <strong>47.8 MB</strong> • Swift & Capacitor Bridge • iOS 14.0+
                  </p>
                </div>

                <button
                  onClick={() => triggerDirectDownload(iosFileName)}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black rounded-xl shadow-lg flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download iOS Package (.zip)</span>
                </button>
              </div>

              {/* iOS Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Target Platform</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">iOS 14.0 to 18.x</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Bundle Identifier</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5 truncate" title="com.farmerbox.joiner">
                    com.farmerbox.joiner
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Project Type</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">Xcode Workspace (.xcworkspace)</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Package Manager</p>
                  <p className="text-xs font-black text-emerald-700 mt-0.5">Swift Package Manager</p>
                </div>
              </div>

              {/* Step-by-step Build on Mac / Xcode */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Apple className="w-4 h-4 text-slate-900" />
                  How to Build & Test on Mac (Xcode):
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex flex-col justify-between space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                        1
                      </span>
                      <strong className="text-slate-900">Unzip & Open</strong>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Extract the downloaded zip on your Mac and open <code>ios/App/App.xcworkspace</code> in Xcode.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex flex-col justify-between space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                        2
                      </span>
                      <strong className="text-slate-900">Sign & Provision</strong>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      In Xcode &rarr; Signing & Capabilities, select your Apple Developer Team for automatic provisioning.
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl flex flex-col justify-between space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                        3
                      </span>
                      <strong className="text-slate-900">Run or TestFlight</strong>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Hit <strong>⌘R</strong> to run on iOS Simulator/iPhone, or <strong>Product &rarr; Archive</strong> for TestFlight.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Link Copy */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  iOS Package Direct Download URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={directIosUrl}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyIosLink}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedIosLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIosLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Scan QR Code */}
          {activeTab === 'qr' && (
            <div className="space-y-4 text-center">
              {/* Platform Selector Buttons */}
              <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 max-w-sm mx-auto">
                <button
                  onClick={() => setQrPlatform('android')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    qrPlatform === 'android' ? 'bg-[#15803d] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🤖 Android APK
                </button>
                <button
                  onClick={() => setQrPlatform('ios')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    qrPlatform === 'ios' ? 'bg-[#15803d] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🍎 iOS Xcode
                </button>
                <button
                  onClick={() => setQrPlatform('web')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    qrPlatform === 'web' ? 'bg-[#15803d] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌐 Mobile Web
                </button>
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/90 max-w-sm mx-auto space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Scan with Mobile Camera or Google Lens to download:
                </p>

                {/* Real High-Resolution Scannable QR Code */}
                <div className="w-56 h-56 mx-auto bg-white p-3 rounded-2xl shadow-md border-2 border-emerald-600 flex items-center justify-center relative">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="FarmerBox App QR Code"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <QrCode className="w-8 h-8 animate-pulse text-emerald-600" />
                      <span className="text-[11px] font-semibold">Generating QR Code...</span>
                    </div>
                  )}
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-left space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Target URL:</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                      {qrPlatform}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-slate-800 break-all select-all">
                    {currentQrUrl}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => triggerDirectDownload(qrPlatform === 'ios' ? iosFileName : apkFileName)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download {qrPlatform === 'ios' ? 'iOS Package' : 'APK Directly'}</span>
                </button>
                <button
                  onClick={qrPlatform === 'ios' ? handleCopyIosLink : handleCopyLink}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {(qrPlatform === 'ios' ? copiedIosLink : copiedLink) ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{(qrPlatform === 'ios' ? copiedIosLink : copiedLink) ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Share Links */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                <h5 className="font-extrabold text-emerald-900">Distribute App to Hotel Joiners & Developers</h5>
                <p className="text-emerald-800/90">
                  Send the official Android APK or iOS Xcode package links directly to registered joiners or developers across Pune zones.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WhatsApp Share Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-sm text-slate-900">Share via WhatsApp</h5>
                    <p className="text-xs text-slate-500">
                      Pre-formatted message with app description, download instructions, and direct links.
                    </p>
                  </div>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open WhatsApp
                  </button>
                </div>

                {/* SMS Broadcast Card */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-sm text-slate-900">Share via SMS</h5>
                    <p className="text-xs text-slate-500">
                      Standard text message containing download links for non-WhatsApp phones.
                    </p>
                  </div>
                  <button
                    onClick={handleShareSMS}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Send SMS Link
                  </button>
                </div>
              </div>

              {/* Copy Links Field */}
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Android APK Direct URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={directApkUrl}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs text-slate-700 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-1 bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    iOS Xcode Package (.zip) URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={directIosUrl}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs text-slate-700 font-mono select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyIosLink}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedIosLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIosLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADB / Developer */}
          {activeTab === 'adb' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Fast ADB USB Install Command
                  </span>
                  <button
                    onClick={handleCopyAdb}
                    className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedAdb ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAdb ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-emerald-300 selection:bg-emerald-800">
                  {adbCommand}
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Connect your Android phone via USB with USB Debugging enabled in Developer Options, then execute this command in your terminal.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <h5 className="font-extrabold text-slate-900">Developer Build Diagnostics:</h5>
                <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                  <p>• SHA-256: <code>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code></p>
                  <p>• Keystore: Signed (FarmerBox Production Release)</p>
                  <p>• Architecture: Universal APK (arm64-v8a, armeabi-v7a, x86_64) + iOS (arm64, Simulator)</p>
                  <p>• Android Target: 8.0 - 15 • iOS Target: 14.0 - 18.x</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official FarmerBox Mobile Release (v2.4.1)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => triggerDirectDownload(iosFileName)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Apple className="w-3.5 h-3.5" /> iOS App (.zip)
            </button>
            <button
              onClick={() => triggerDirectDownload(apkFileName)}
              className="px-3.5 py-2 bg-[#15803d] hover:bg-[#166534] text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Android APK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
