import React from 'react';
import {
  Flashlight,
  Timer,
  Lightbulb,
  Grid,
  Battery,
  ShieldCheck,
  Settings,
} from 'lucide-react';

interface QuickControlDockProps {
  isTorchOn: boolean;
  onToggleTorch: () => void;
  onOpenTimers: () => void;
  onOpenSmartLights: () => void;
  onOpenAppLauncher: () => void;
  onOpenBatteryInfo: () => void;
  onOpenAndroidBuilder: () => void;
  onOpenSettings: () => void;
  batteryLevel: number;
}

export const QuickControlDock: React.FC<QuickControlDockProps> = ({
  isTorchOn,
  onToggleTorch,
  onOpenTimers,
  onOpenSmartLights,
  onOpenAppLauncher,
  onOpenBatteryInfo,
  onOpenAndroidBuilder,
  onOpenSettings,
  batteryLevel,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-[#060c1d]/90 backdrop-blur-lg border-t border-cyan-500/25 px-2 py-2 z-30 transition-all">
      <div className="max-w-md mx-auto grid grid-cols-7 gap-1 sm:gap-2">
        {/* Flashlight Button */}
        <button
          onClick={onToggleTorch}
          className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border transition-all active:scale-90 ${
            isTorchOn
              ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
              : 'bg-[#0b1328] border-cyan-500/20 text-cyan-300/70 hover:text-cyan-200'
          }`}
          title="Toggle Mobile Flashlight"
        >
          <Flashlight className={`w-4 h-4 sm:w-5 sm:h-5 ${isTorchOn ? 'text-amber-300 animate-pulse' : ''}`} />
          <span className="text-[9px] sm:text-[10px] font-mono mt-1">Torch</span>
        </button>

        {/* Timers & Alarms Button */}
        <button
          onClick={onOpenTimers}
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#0b1328] border border-cyan-500/20 text-cyan-300/70 hover:text-cyan-200 hover:border-cyan-400/40 transition-all active:scale-90"
          title="Timers & Alarms"
        >
          <Timer className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-mono mt-1">Timers</span>
        </button>

        {/* Smart Lights Hub Button */}
        <button
          onClick={onOpenSmartLights}
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#0b1328] border border-cyan-500/20 text-cyan-300/70 hover:text-cyan-200 hover:border-cyan-400/40 transition-all active:scale-90"
          title="Smart Home Lights Hub"
        >
          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-mono mt-1">Lights</span>
        </button>

        {/* Apps Launcher Button */}
        <button
          onClick={onOpenAppLauncher}
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#0b1328] border border-cyan-500/20 text-cyan-300/70 hover:text-cyan-200 hover:border-cyan-400/40 transition-all active:scale-90"
          title="Open Android Apps"
        >
          <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-mono mt-1">Apps</span>
        </button>

        {/* Battery Info Button */}
        <button
          onClick={onOpenBatteryInfo}
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#0b1328] border border-cyan-500/20 text-cyan-300/70 hover:text-cyan-200 hover:border-cyan-400/40 transition-all active:scale-90"
          title="Check Battery & Telemetry"
        >
          <Battery className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-300" />
          <span className="text-[9px] sm:text-[10px] font-mono mt-1">{batteryLevel}%</span>
        </button>

        {/* Android Builder / APK Studio Guide Button */}
        <button
          onClick={onOpenAndroidBuilder}
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 transition-all active:scale-90"
          title="Android Phone-Only Builder & Native APK Guide"
        >
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <span className="text-[9px] sm:text-[10px] font-mono mt-1 font-semibold">APK</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl bg-[#0b1328] border border-cyan-500/20 text-cyan-300/70 hover:text-cyan-200 hover:border-cyan-400/40 transition-all active:scale-90"
          title="Settings & Preferences"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[9px] sm:text-[10px] font-mono mt-1">Setup</span>
        </button>
      </div>
    </nav>
  );
};
