import React, { useState } from 'react';
import {
  X,
  Youtube,
  MessageCircle,
  Camera,
  Image,
  Phone,
  Sliders,
  MapPin,
  Globe,
  Calculator,
  Clock,
  ExternalLink,
  PhoneCall,
  Check,
} from 'lucide-react';
import { androidSystem, AppIntentDefinition } from '../services/androidSystem';
import { soundFx } from '../services/soundEffects';

interface AppLauncherModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'ur' | 'auto';
  onAppLaunched: (appName: string, notice: string) => void;
}

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  isOpen,
  onClose,
  language,
  onAppLaunched,
}) => {
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cameraActive, setCameraActive] = useState(false);

  if (!isOpen) return null;

  const apps = androidSystem.getInstalledApps();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Youtube':
        return <Youtube className="w-5 h-5 text-rose-400" />;
      case 'MessageCircle':
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      case 'Camera':
        return <Camera className="w-5 h-5 text-cyan-400" />;
      case 'Image':
        return <Image className="w-5 h-5 text-blue-400" />;
      case 'Phone':
        return <Phone className="w-5 h-5 text-emerald-400" />;
      case 'Sliders':
        return <Sliders className="w-5 h-5 text-slate-300" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-rose-400" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-blue-400" />;
      case 'Calculator':
        return <Calculator className="w-5 h-5 text-amber-400" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-cyan-400" />;
      default:
        return <ExternalLink className="w-5 h-5 text-cyan-300" />;
    }
  };

  const handleLaunch = (app: AppIntentDefinition) => {
    soundFx.playClick();

    if (app.id === 'phone') {
      setCallModalOpen(true);
      return;
    }

    if (app.id === 'camera') {
      setCameraActive(true);
      return;
    }

    const res = androidSystem.launchApp(app.id);
    onAppLaunched(res.appName, res.actionNotice);
    onClose();
  };

  const handleConfirmCall = () => {
    if (!phoneNumber) return;
    soundFx.playSuccess();
    window.location.href = `tel:${encodeURIComponent(phoneNumber)}`;
    onAppLaunched('Phone Dialer', `Calling ${phoneNumber}`);
    setCallModalOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#070e22] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#050a18] border-b border-cyan-500/25">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              MOBILE APPS & CONTROLS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-cyan-950/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Live Camera Viewfinder Modal */}
          {cameraActive && (
            <div className="p-3 bg-black rounded-xl border border-cyan-400 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
                  MIRROR HUD OPTICAL SENSOR
                </span>
                <button
                  onClick={() => setCameraActive(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-cyan-500/30">
                <video
                  ref={(v) => {
                    if (v && !v.srcObject) {
                      navigator.mediaDevices
                        ?.getUserMedia({ video: { facingMode: 'environment' } })
                        .then((stream) => {
                          v.srcObject = stream;
                          v.play();
                        })
                        .catch(() => {});
                    }
                  }}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {/* HUD Crosshair */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-16 h-16 border border-cyan-400/40 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-cyan-400/70 text-center">
                Optical sensor online. You can also trigger system camera via voice ("Hey Mirror, open camera").
              </p>
            </div>
          )}

          {/* Grid of Apps */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => handleLaunch(app)}
                className="p-3 rounded-xl bg-[#0b142d] hover:bg-cyan-950/60 border border-cyan-500/20 hover:border-cyan-400/50 flex flex-col items-center justify-center text-center transition-all active:scale-95 group shadow-sm"
              >
                <div className="p-2 rounded-lg bg-[#070d1e] group-hover:scale-110 transition-transform mb-1.5">
                  {getIcon(app.iconName)}
                </div>
                <span className="text-xs font-bold text-white group-hover:text-cyan-300">
                  {app.name}
                </span>
                <span className="text-[10px] text-cyan-400/60 font-['Noto_Nastaliq_Urdu'] mt-0.5">
                  {app.nameUrdu}
                </span>
              </button>
            ))}
          </div>

          {/* Call Confirmation Dialog */}
          {callModalOpen && (
            <div className="p-3.5 rounded-xl bg-[#091129] border border-cyan-400 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  CONFIRM CALL RECIPIENT
                </span>
                <button onClick={() => setCallModalOpen(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number or contact..."
                className="w-full bg-[#060b1c] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmCall}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call Now
                </button>
                <button
                  onClick={() => setCallModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Voice Command Hints */}
          <div className="p-3 rounded-xl bg-[#081026] border border-cyan-500/20 text-[11px] text-slate-300 space-y-1">
            <span className="font-bold text-cyan-300 block">Voice Command Examples:</span>
            <p>• "Hey Mirror, open YouTube and search Lo-Fi Beats"</p>
            <p>• "Hey Mirror, open WhatsApp"</p>
            <p>• "Hey Mirror, call +923001234567"</p>
            <p>• "مرر، یوٹیوب کھولیں" یا "کیمرہ آن کرو"</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#050a18] border-t border-cyan-500/25 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
