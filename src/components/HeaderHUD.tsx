import React, { useState, useEffect } from 'react';
import { Battery, BatteryCharging, Wifi, WifiOff, Globe, Radio, Download, ShieldCheck, Cpu } from 'lucide-react';
import { BatteryInfo } from '../services/androidSystem';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AssistantLanguage } from '../services/voiceService';

interface HeaderHUDProps {
  battery: BatteryInfo;
  language: AssistantLanguage;
  onLanguageChange: (lang: AssistantLanguage) => void;
  isWakeWordActive: boolean;
  onToggleWakeWord: () => void;
  onOpenAndroidBuilder: () => void;
  onOpenSettings: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  battery,
  language,
  onLanguageChange,
  isWakeWordActive,
  onToggleWakeWord,
  onOpenAndroidBuilder,
  onOpenSettings,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const { isInstallable, install } = usePWAInstall();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="w-full bg-[#070d1e]/85 backdrop-blur-md border-b border-cyan-500/20 px-3 py-2.5 sm:px-4 sm:py-3 sticky top-0 z-40 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & System Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_12px_rgba(0,243,255,0.25)]">
            <Cpu className="w-5 h-5 text-cyan-300" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h1
                className="text-base sm:text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-white"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                MIRROR AI
              </h1>
              <span className="hidden xs:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/30">
                v2.5
              </span>
            </div>
            <p className="text-[10px] font-mono text-cyan-400/60 leading-tight">
              PERSONAL ANDROID AGENT
            </p>
          </div>
        </div>

        {/* Telemetry Stats: Battery, Clock, Online */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real Phone Battery */}
          <div
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#0b1329] border border-cyan-500/20 text-xs font-mono text-cyan-200"
            title={`Battery: ${battery.level}% ${battery.charging ? '(Charging)' : ''}`}
          >
            {battery.charging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <Battery
                className={`w-3.5 h-3.5 ${
                  battery.level < 20
                    ? 'text-rose-400'
                    : battery.level < 50
                    ? 'text-amber-400'
                    : 'text-cyan-300'
                }`}
              />
            )}
            <span className="text-[11px] font-semibold">{battery.level}%</span>
          </div>

          {/* Clock Display */}
          <div className="hidden sm:flex items-center px-2.5 py-1 rounded bg-[#0b1329] border border-cyan-500/20 text-[11px] font-mono text-cyan-300/80">
            {timeStr}
          </div>

          {/* Online status */}
          <div
            className="flex items-center px-1.5 py-1 rounded bg-[#0b1329] border border-cyan-500/20"
            title={isOnline ? 'Network: Online' : 'Network: Offline (Cache Mode)'}
          >
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>

          {/* Language Toggle (EN / اردو) */}
          <button
            onClick={() => onLanguageChange(language === 'ur' ? 'en' : 'ur')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border transition-all ${
              language === 'ur'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 font-["Noto_Nastaliq_Urdu"]'
                : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
            }`}
            title="Toggle between English and Urdu (اردو)"
          >
            <Globe className="w-3 h-3" />
            <span>{language === 'ur' ? 'اردو' : 'EN'}</span>
          </button>

          {/* Wake Word Standby Toggle Button */}
          <button
            onClick={onToggleWakeWord}
            className={`hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border transition-all ${
              isWakeWordActive
                ? 'bg-blue-600/30 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,243,255,0.3)] animate-pulse'
                : 'bg-[#0c142b] border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Continuous 'Hey Mirror' Voice Wake-Word listener"
          >
            <Radio className={`w-3.5 h-3.5 ${isWakeWordActive ? 'text-cyan-300' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Hey Mirror</span>
          </button>

          {/* Install PWA Button if available */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-semibold shadow-md transition-all active:scale-95"
              title="Install Mirror AI as Android App"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install APK</span>
            </button>
          )}

          {/* Android Phone Builder / APK Studio Shortcut */}
          <button
            onClick={onOpenAndroidBuilder}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold transition-all active:scale-95"
            title="Android Phone-Only Builder & APK Instructions"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Phone APK Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
