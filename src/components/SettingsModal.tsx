import React, { useState } from 'react';
import {
  X,
  Settings,
  User,
  Globe,
  Radio,
  Volume2,
  Save,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AssistantLanguage } from '../services/voiceService';
import { soundFx } from '../services/soundEffects';

interface UserSettings {
  userName: string;
  assistantName: string;
  defaultLanguage: AssistantLanguage;
  speechRate: number;
  autoSpeakResponse: boolean;
  hapticFeedback: boolean;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (s: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<UserSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    soundFx.playSuccess();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    soundFx.playClick();
    const defaults: UserSettings = {
      userName: 'Fahad',
      assistantName: 'Mirror AI',
      defaultLanguage: 'en',
      speechRate: 1.0,
      autoSpeakResponse: true,
      hapticFeedback: true,
    };
    setFormData(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#070e22] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#050a18] border-b border-cyan-500/25">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              ASSISTANT PREFERENCES
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
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              Your Name / Title:
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              placeholder="e.g. Fahad or Boss"
              className="w-full bg-[#0a142e] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <p className="mt-1 text-[10px] text-cyan-400/60">
              Mirror AI addresses you politely using this name in English and Urdu.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              Primary Language:
            </label>
            <select
              value={formData.defaultLanguage}
              onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value as any })}
              className="w-full bg-[#0a142e] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="en">English (Futuristic JARVIS)</option>
              <option value="ur">اردو (Urdu Natural Voice)</option>
              <option value="auto">Auto-Detect Language</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                Speech Synthesis Rate:
              </label>
              <span className="text-cyan-300 font-bold">{formData.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={formData.speechRate}
              onChange={(e) => setFormData({ ...formData, speechRate: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 h-1.5 bg-[#060b1c] rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-cyan-500/20">
            <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b142d] cursor-pointer">
              <span>Always Speak Answers Aloud</span>
              <input
                type="checkbox"
                checked={formData.autoSpeakResponse}
                onChange={(e) => setFormData({ ...formData, autoSpeakResponse: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-xl bg-[#0b142d] cursor-pointer">
              <span>Android Haptic Vibration Feedback</span>
              <input
                type="checkbox"
                checked={formData.hapticFeedback}
                onChange={(e) => setFormData({ ...formData, hapticFeedback: e.target.checked })}
                className="w-4 h-4 accent-cyan-400 rounded"
              />
            </label>
          </div>

          <div className="p-3 rounded-xl bg-[#081026] border border-cyan-500/20 text-[11px] text-slate-400">
            🛡️ <strong>Privacy Notice:</strong> Preferences are stored locally on your device in your browser storage. Mirror AI does not sell or share personal data.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#050a18] border-t border-cyan-500/25 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Defaults
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
              {isSaved ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
