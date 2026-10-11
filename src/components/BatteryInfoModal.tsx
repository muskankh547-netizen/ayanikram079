import React from 'react';
import {
  X,
  Battery,
  BatteryCharging,
  Cpu,
  Monitor,
  Wifi,
  HardDrive,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { BatteryInfo, DeviceTelemetry, androidSystem } from '../services/androidSystem';

interface BatteryInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  battery: BatteryInfo;
  telemetry: DeviceTelemetry;
  onRefresh: () => void;
}

export const BatteryInfoModal: React.FC<BatteryInfoModalProps> = ({
  isOpen,
  onClose,
  battery,
  telemetry,
  onRefresh,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#070e22] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#050a18] border-b border-cyan-500/25">
          <div className="flex items-center gap-2">
            <Battery className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              BATTERY & PHONE TELEMETRY
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
        <div className="p-4 space-y-4 max-h-[65vh] overflow-y-auto text-xs text-slate-200">
          {/* Battery Core Meter */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#0a1534] to-[#071026] border border-cyan-500/30 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-cyan-300">
                  {battery.level}%
                </span>
                {battery.charging && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <BatteryCharging className="w-3 h-3 text-emerald-400" />
                    Charging
                  </span>
                )}
              </div>
              <p className="text-[11px] text-cyan-400/70 mt-1">
                {battery.charging ? 'Power source connected' : 'Discharging on battery power'}
              </p>
            </div>

            {/* Visual Battery Bar */}
            <div className="w-24 h-10 border-2 border-cyan-400/60 rounded-lg p-1 relative flex items-center">
              <div
                className={`h-full rounded transition-all duration-500 ${
                  battery.level < 20
                    ? 'bg-rose-500'
                    : battery.level < 50
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                }`}
                style={{ width: `${battery.level}%` }}
              />
              <div className="absolute -right-2 top-2 bottom-2 w-1.5 bg-cyan-400/60 rounded-r" />
            </div>
          </div>

          {/* Telemetry Hardware Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#0b142d] border border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                <Cpu className="w-3.5 h-3.5" />
                Processor Cores
              </div>
              <span className="text-sm font-bold text-white">{telemetry.cores} Logic Cores</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0b142d] border border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                <HardDrive className="w-3.5 h-3.5" />
                Device Memory
              </div>
              <span className="text-sm font-bold text-white">
                {telemetry.memoryGb ? `${telemetry.memoryGb} GB RAM` : 'Budget Android Optimized'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0b142d] border border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                <Monitor className="w-3.5 h-3.5" />
                Screen Resolution
              </div>
              <span className="text-[11px] font-bold text-white">{telemetry.screenResolution}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0b142d] border border-cyan-500/20">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                <Wifi className="w-3.5 h-3.5" />
                Network Link
              </div>
              <span className="text-sm font-bold text-white">{telemetry.connectionType}</span>
            </div>
          </div>

          {/* Android Permissions Status */}
          <div className="p-3 rounded-xl bg-[#081026] border border-cyan-500/20 space-y-2">
            <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Android API Integration Status
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0b142d]">
                <span className="text-slate-400">Microphone / Speech:</span>
                <span className="text-emerald-400 font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0b142d]">
                <span className="text-slate-400">Camera Torch:</span>
                <span className="text-cyan-300 font-bold">Available</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0b142d]">
                <span className="text-slate-400">Battery Monitoring:</span>
                <span className="text-emerald-400 font-bold">Connected</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#0b142d]">
                <span className="text-slate-400">PWA / Standalone:</span>
                <span className="text-cyan-300 font-bold">Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#050a18] border-t border-cyan-500/25 flex items-center justify-between">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-200"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
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
