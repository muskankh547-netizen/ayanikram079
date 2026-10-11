import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Plus, Bell, Clock, Trash2, Check } from 'lucide-react';
import { soundFx } from '../services/soundEffects';
import { voiceService } from '../services/voiceService';

export interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

export interface ScheduledAlarm {
  id: string;
  timeStr: string; // e.g. "07:30"
  period: 'AM' | 'PM';
  label: string;
  enabled: boolean;
}

interface TimersAlarmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTimers: ActiveTimer[];
  setActiveTimers: React.Dispatch<React.SetStateAction<ActiveTimer[]>>;
  alarms: ScheduledAlarm[];
  setAlarms: React.Dispatch<React.SetStateAction<ScheduledAlarm[]>>;
}

export const TimersAlarmsModal: React.FC<TimersAlarmsModalProps> = ({
  isOpen,
  onClose,
  activeTimers,
  setActiveTimers,
  alarms,
  setAlarms,
}) => {
  const [activeTab, setActiveTab] = useState<'timers' | 'alarms'>('timers');
  const [customMinutes, setCustomMinutes] = useState('5');
  const [customLabel, setCustomLabel] = useState('Timer');

  // Alarm input state
  const [alarmTime, setAlarmTime] = useState('07:00');
  const [alarmLabel, setAlarmLabel] = useState('Morning Alarm');

  if (!isOpen) return null;

  const addTimer = (seconds: number, label: string) => {
    soundFx.playClick();
    const newTimer: ActiveTimer = {
      id: Date.now().toString(),
      label: label || 'Timer',
      totalSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: true,
    };
    setActiveTimers((prev) => [newTimer, ...prev]);
  };

  const toggleTimer = (id: string) => {
    soundFx.playClick();
    setActiveTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const resetTimer = (id: string) => {
    soundFx.playClick();
    setActiveTimers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isRunning: false } : t))
    );
  };

  const deleteTimer = (id: string) => {
    setActiveTimers((prev) => prev.filter((t) => t.id !== id));
  };

  const addAlarm = () => {
    soundFx.playClick();
    const [hours, minutes] = alarmTime.split(':');
    const h = parseInt(hours, 10);
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    const timeDisplay = `${formattedHour.toString().padStart(2, '0')}:${minutes}`;

    const newAlarm: ScheduledAlarm = {
      id: Date.now().toString(),
      timeStr: timeDisplay,
      period,
      label: alarmLabel || 'Alarm',
      enabled: true,
    };
    setAlarms((prev) => [...prev, newAlarm]);
  };

  const toggleAlarm = (id: string) => {
    soundFx.playClick();
    setAlarms((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const formatTimeDisplay = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#070e22] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#050a18] border-b border-cyan-500/25">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              TIMERS & ALARMS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-cyan-950/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-cyan-500/20 bg-[#060c1d]">
          <button
            onClick={() => setActiveTab('timers')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'timers'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ACTIVE TIMERS ({activeTimers.length})
          </button>
          <button
            onClick={() => setActiveTab('alarms')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'alarms'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ALARMS ({alarms.length})
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'timers' ? (
            <>
              {/* Presets */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { m: 1, s: 60, label: '1m Tea' },
                  { m: 3, s: 180, label: '3m Quick' },
                  { m: 5, s: 300, label: '5m Focus' },
                  { m: 15, s: 900, label: '15m Task' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => addTimer(preset.s, preset.label)}
                    className="p-2 rounded-xl bg-[#0b142d] hover:bg-cyan-950/60 border border-cyan-500/25 hover:border-cyan-400/50 text-cyan-300 text-center transition-all active:scale-95"
                  >
                    <span className="block text-sm font-bold">{preset.m}m</span>
                    <span className="text-[10px] text-cyan-400/60">{preset.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>

              {/* Custom Timer Input */}
              <div className="p-3 rounded-xl bg-[#081026] border border-cyan-500/20 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Min"
                  className="w-16 bg-[#0c1736] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs text-slate-400">min</span>

                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="Timer label (e.g. Study)"
                  className="flex-1 bg-[#0c1736] border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />

                <button
                  onClick={() => {
                    const mins = parseInt(customMinutes, 10);
                    if (mins > 0) addTimer(mins * 60, customLabel || 'Timer');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {/* Active Timers List */}
              <div className="space-y-2">
                {activeTimers.length === 0 ? (
                  <p className="text-center py-6 text-cyan-400/50 text-xs">
                    No active timers. Speak "Hey Mirror, set a 5 minute timer" or pick a preset above.
                  </p>
                ) : (
                  activeTimers.map((timer) => {
                    const progress = 1 - timer.remainingSeconds / timer.totalSeconds;
                    return (
                      <div
                        key={timer.id}
                        className="p-3 rounded-xl bg-[#0b142d] border border-cyan-500/30 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-cyan-300">
                              {formatTimeDisplay(timer.remainingSeconds)}
                            </span>
                            <span className="text-xs text-slate-300 font-medium">
                              {timer.label}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2 h-1.5 w-full bg-[#070b1a] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleTimer(timer.id)}
                            className={`p-2 rounded-lg border text-white transition-all active:scale-95 ${
                              timer.isRunning
                                ? 'bg-amber-600/30 border-amber-500/50 hover:bg-amber-600/50'
                                : 'bg-emerald-600/30 border-emerald-500/50 hover:bg-emerald-600/50'
                            }`}
                          >
                            {timer.isRunning ? <Pause className="w-4 h-4 text-amber-300" /> : <Play className="w-4 h-4 text-emerald-300" />}
                          </button>

                          <button
                            onClick={() => resetTimer(timer.id)}
                            className="p-2 rounded-lg bg-[#0e1938] border border-cyan-500/20 hover:bg-cyan-950/60 text-slate-300 hover:text-white transition-all active:scale-95"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteTimer(timer.id)}
                            className="p-2 rounded-lg bg-[#0e1938] border border-rose-500/20 hover:bg-rose-950/40 text-rose-300 transition-all active:scale-95"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
              {/* Alarms Tab */}
              <div className="p-3 rounded-xl bg-[#081026] border border-cyan-500/20 flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={alarmTime}
                  onChange={(e) => setAlarmTime(e.target.value)}
                  className="bg-[#0c1736] border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />

                <input
                  type="text"
                  value={alarmLabel}
                  onChange={(e) => setAlarmLabel(e.target.value)}
                  placeholder="Alarm label"
                  className="flex-1 min-w-[120px] bg-[#0c1736] border border-cyan-500/30 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />

                <button
                  onClick={addAlarm}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Set Alarm
                </button>
              </div>

              <div className="space-y-2">
                {alarms.length === 0 ? (
                  <p className="text-center py-6 text-cyan-400/50 text-xs">
                    No alarms scheduled.
                  </p>
                ) : (
                  alarms.map((alarm) => (
                    <div
                      key={alarm.id}
                      className="p-3 rounded-xl bg-[#0b142d] border border-cyan-500/25 flex items-center justify-between shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className={`w-4 h-4 ${alarm.enabled ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-white tracking-wide">
                              {alarm.timeStr}
                            </span>
                            <span className="text-xs text-cyan-300 font-semibold">
                              {alarm.period}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">{alarm.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAlarm(alarm.id)}
                          className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                            alarm.enabled ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
                              alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <button
                          onClick={() => deleteAlarm(alarm.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
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
