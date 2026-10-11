import React, { useState } from 'react';
import {
  X,
  Lightbulb,
  Power,
  Sliders,
  Sparkles,
  Wifi,
  ShieldAlert,
  Save,
  Check,
} from 'lucide-react';
import { smartLights, SmartLightRoom, SmartHomeConfig } from '../services/smartLights';
import { soundFx } from '../services/soundEffects';

interface SmartLightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: SmartLightRoom[];
  onRoomsUpdate: (rooms: SmartLightRoom[]) => void;
  language: 'en' | 'ur' | 'auto';
}

export const SmartLightsModal: React.FC<SmartLightsModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onRoomsUpdate,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'scenes' | 'hardware'>('rooms');
  const [config, setConfig] = useState<SmartHomeConfig>(smartLights.getConfig());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const toggleRoom = (roomId: string) => {
    soundFx.playClick();
    smartLights.toggleRoom(roomId);
    onRoomsUpdate(smartLights.getRooms());
  };

  const handleBrightnessChange = (roomId: string, val: number) => {
    smartLights.setRoomState(roomId, { brightness: val });
    onRoomsUpdate(smartLights.getRooms());
  };

  const handleColorChange = (roomId: string, hex: string) => {
    soundFx.playClick();
    smartLights.setRoomState(roomId, { color: hex });
    onRoomsUpdate(smartLights.getRooms());
  };

  const applyScene = (scene: 'movie' | 'focus' | 'cyberpunk' | 'night' | 'all_off') => {
    soundFx.playSuccess();
    const updated = smartLights.applyScene(scene);
    onRoomsUpdate(updated);
  };

  const saveConfig = () => {
    soundFx.playSuccess();
    smartLights.updateConfig(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const colorPresets = ['#00f3ff', '#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#ffffff'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#070e22] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#050a18] border-b border-cyan-500/25">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-300" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              SMART LIGHTS HUB
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
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'rooms'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ROOMS ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('scenes')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'scenes'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            PRESET SCENES
          </button>
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'hardware'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            HARDWARE SETUP
          </button>
        </div>

        {/* Hardware Truth Notice */}
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            {language === 'ur'
              ? 'اہم: یہ کنٹرولر سمارٹ ہوم بلب (Home Assistant / Tuya / Wi-Fi) کو کنٹرول کرتا ہے، عام روایتی بلبوں کو نہیں۔'
              : 'Note: Requires compatible smart bulbs or home automation bridge (Home Assistant / Tuya) for physical control.'}
          </span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'rooms' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    room.isOn
                      ? 'bg-[#0a1534] border-cyan-400/50 shadow-lg'
                      : 'bg-[#080f24] border-cyan-500/20 opacity-75'
                  }`}
                  style={{
                    boxShadow: room.isOn ? `0 0 16px ${room.color}33` : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full transition-all"
                        style={{
                          backgroundColor: room.isOn ? room.color : '#334155',
                          boxShadow: room.isOn ? `0 0 10px ${room.color}` : 'none',
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-white text-xs">{room.name}</h4>
                        <span className="text-[10px] text-cyan-400/70 font-['Noto_Nastaliq_Urdu']">{room.nameUrdu}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleRoom(room.id)}
                      className={`p-2 rounded-lg border transition-all active:scale-95 ${
                        room.isOn
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-[#0c142b] border-slate-700 text-slate-500'
                      }`}
                      title="Toggle Power"
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Brightness Slider */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                      <span>Brightness</span>
                      <span className="font-bold text-cyan-300">{room.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={room.brightness}
                      onChange={(e) => handleBrightnessChange(room.id, parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 h-1.5 bg-[#060b1c] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Color Palette Swatches */}
                  <div className="mt-2.5 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-400">Tone:</span>
                    <div className="flex items-center gap-1.5">
                      {colorPresets.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleColorChange(room.id, c)}
                          className={`w-4 h-4 rounded-full border transition-transform ${
                            room.color === c ? 'scale-125 border-white' : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'scenes' && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'movie', name: 'Movie Night', desc: 'Dim blue lighting in Living Room', icon: '🎬', color: 'border-blue-500/40' },
                { id: 'focus', name: 'Studio Focus', desc: '100% Crisp White daylight', icon: '⚡', color: 'border-cyan-500/40' },
                { id: 'cyberpunk', name: 'JARVIS Neon', desc: 'Neon Cyan & Magenta ambient', icon: '🔮', color: 'border-purple-500/40' },
                { id: 'night', name: 'Night Warmth', desc: '15% Warm amber in Bedroom', icon: '🌙', color: 'border-amber-500/40' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => applyScene(s.id as any)}
                  className={`p-3.5 rounded-xl bg-[#09122a] hover:bg-cyan-950/60 border ${s.color} text-left transition-all active:scale-95`}
                >
                  <span className="text-2xl mb-1 block">{s.icon}</span>
                  <h4 className="font-bold text-white text-xs">{s.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.desc}</p>
                </button>
              ))}

              <button
                onClick={() => applyScene('all_off')}
                className="col-span-2 p-3 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 text-rose-300 font-bold text-xs text-center transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Power className="w-4 h-4" />
                Turn All Smart Lights Off
              </button>
            </div>
          )}

          {activeTab === 'hardware' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 text-xs mb-1 font-semibold">
                  Integration Mode:
                </label>
                <select
                  value={config.integrationType}
                  onChange={(e) => setConfig({ ...config, integrationType: e.target.value as any })}
                  className="w-full bg-[#0a142e] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="simulator">Interactive Visual Simulator (Offline/Test)</option>
                  <option value="home_assistant">Home Assistant (Local Network / Nabu Casa)</option>
                  <option value="tuya_webhook">Tuya / Smart Life Webhook (Cloud REST)</option>
                </select>
              </div>

              {config.integrationType === 'home_assistant' && (
                <>
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-1">
                      Home Assistant URL (e.g. http://192.168.1.50:8123 or Nabu Casa):
                    </label>
                    <input
                      type="text"
                      value={config.homeAssistantUrl}
                      onChange={(e) => setConfig({ ...config, homeAssistantUrl: e.target.value })}
                      placeholder="http://192.168.1.50:8123"
                      className="w-full bg-[#0a142e] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-[11px] mb-1">
                      Long-Lived Access Token:
                    </label>
                    <input
                      type="password"
                      value={config.homeAssistantToken}
                      onChange={(e) => setConfig({ ...config, homeAssistantToken: e.target.value })}
                      placeholder="eyJhbGciOi..."
                      className="w-full bg-[#0a142e] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </>
              )}

              {config.integrationType === 'tuya_webhook' && (
                <div>
                  <label className="block text-slate-300 text-[11px] mb-1">
                    Webhook URL:
                  </label>
                  <input
                    type="text"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                    placeholder="https://maker.ifttt.com/trigger/... or webhook endpoint"
                    className="w-full bg-[#0a142e] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}

              <button
                onClick={saveConfig}
                className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
              >
                {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                {isSaved ? 'Settings Saved!' : 'Save Integration Config'}
              </button>
            </div>
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
