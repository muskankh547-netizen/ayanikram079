import React from 'react';
import { Mic, MicOff, Volume2, Sparkles, Radio } from 'lucide-react';
import { VoiceState } from '../services/voiceService';

interface ArcReactorCoreProps {
  voiceState: VoiceState;
  isProcessing: boolean;
  onToggleListen: () => void;
  language: 'en' | 'ur' | 'auto';
}

export const ArcReactorCore: React.FC<ArcReactorCoreProps> = ({
  voiceState,
  isProcessing,
  onToggleListen,
  language,
}) => {
  const { isListening, isSpeaking, isWakeWordActive, audioLevel } = voiceState;

  // Compute reactive pulse size based on audio level
  const pulseScale = 1 + (isListening || isSpeaking ? audioLevel * 0.28 : 0);
  const glowIntensity = Math.min(1, 0.4 + audioLevel * 0.6);

  // Status label
  let statusText = 'MIRROR AI : STANDBY';
  let statusColor = 'text-cyan-400 border-cyan-500/30 bg-cyan-950/40';

  if (isProcessing) {
    statusText = language === 'ur' ? 'پروسیسنگ جاری ہے...' : 'NEURAL PROCESSING...';
    statusColor = 'text-amber-400 border-amber-500/40 bg-amber-950/40 animate-pulse';
  } else if (isSpeaking) {
    statusText = language === 'ur' ? 'مرر اے آئی بول رہا ہے...' : 'TRANSMITTING VOICE...';
    statusColor = 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40';
  } else if (isListening) {
    statusText = language === 'ur' ? 'آپ کی آواز سن رہا ہوں...' : 'LISTENING TO USER...';
    statusColor = 'text-cyan-300 border-cyan-400/50 bg-cyan-900/50 shadow-lg shadow-cyan-500/20';
  } else if (isWakeWordActive) {
    statusText = language === 'ur' ? '"Hey Mirror" سن رہا ہے' : 'WAKE-WORD ACTIVE: "HEY MIRROR"';
    statusColor = 'text-blue-300 border-blue-500/40 bg-blue-950/40';
  }

  return (
    <div className="relative flex flex-col items-center justify-center my-4 select-none">
      {/* Ambient Radial Background Glow */}
      <div
        className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full blur-3xl pointer-events-none transition-all duration-300"
        style={{
          background: isProcessing
            ? 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, rgba(5,8,20,0) 70%)'
            : isSpeaking
            ? 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(5,8,20) 70%)'
            : isListening
            ? 'radial-gradient(circle, rgba(0,243,255,0.35) 0%, rgba(5,8,20,0) 70%)'
            : 'radial-gradient(circle, rgba(0,102,255,0.18) 0%, rgba(5,8,20,0) 70%)',
        }}
      />

      {/* Main Interactive Hologram Core */}
      <div
        onClick={onToggleListen}
        className="relative w-64 h-64 sm:w-72 sm:h-72 cursor-pointer flex items-center justify-center group touch-manipulation"
        title="Tap to activate Mirror AI voice command"
      >
        {/* Outer Ring 1: Rotating Dashed Ring */}
        <div
          className={`absolute inset-0 rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
            isListening ? 'border-cyan-400/60 scale-105' : 'border-cyan-500/20'
          }`}
          style={{
            animation: isProcessing ? 'spin 3s linear infinite' : 'spin 18s linear infinite',
          }}
        />

        {/* Outer Ring 2: Segmented Arc Ring (Counter-Clockwise) */}
        <div
          className="absolute inset-3 sm:inset-4 rounded-full border-2 border-transparent border-t-cyan-400/50 border-b-blue-500/50 pointer-events-none"
          style={{
            animation: isProcessing
              ? 'spin-reverse 2s linear infinite'
              : isListening
              ? 'spin-reverse 8s linear infinite'
              : 'spin-reverse 24s linear infinite',
          }}
        />

        {/* Orbiting Quantum Nodes */}
        <div
          className="absolute inset-1 rounded-full pointer-events-none"
          style={{ animation: 'spin 12s linear infinite' }}
        >
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_12px_#00f3ff]" />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_#3b82f6]" />
        </div>

        {/* Middle Hexagonal Shield & Pulse Wave */}
        <div
          className="absolute inset-7 sm:inset-8 rounded-full border border-cyan-500/30 flex items-center justify-center transition-transform duration-150 pointer-events-none"
          style={{
            transform: `scale(${pulseScale})`,
            boxShadow: `0 0 ${20 * glowIntensity}px rgba(0, 243, 255, ${0.3 * glowIntensity})`,
          }}
        >
          {/* Hexagonal decorative dots */}
          <div className="absolute inset-0 rounded-full bg-radial from-cyan-950/40 via-transparent to-transparent" />
        </div>

        {/* Audio Reactive Frequency Rings */}
        {(isListening || isSpeaking) && (
          <div
            className="absolute inset-10 rounded-full border border-cyan-400/40 animate-ping pointer-events-none"
            style={{ animationDuration: isSpeaking ? '1.2s' : '1.8s' }}
          />
        )}

        {/* Core Arc Reactor Chamber */}
        <div
          className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 shadow-2xl ${
            isProcessing
              ? 'border-amber-400/80 bg-gradient-to-b from-amber-950/80 to-[#070b18] shadow-amber-500/30'
              : isSpeaking
              ? 'border-emerald-400/80 bg-gradient-to-b from-emerald-950/80 to-[#070b18] shadow-emerald-500/30'
              : isListening
              ? 'border-cyan-300 bg-gradient-to-b from-cyan-950/90 to-[#050814] shadow-cyan-400/40'
              : 'border-cyan-500/40 bg-gradient-to-b from-[#0e172e] to-[#050814] shadow-cyan-900/30 group-hover:border-cyan-400/70'
          }`}
          style={{
            transform: `scale(${pulseScale})`,
          }}
        >
          {/* Internal Hologram Reactor Glow */}
          <div className="absolute inset-2 rounded-full border border-cyan-400/20 border-dotted" />

          {/* Central Iconography */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {isProcessing ? (
              <Sparkles className="w-10 h-10 text-amber-300 animate-spin" />
            ) : isSpeaking ? (
              <Volume2 className="w-11 h-11 text-emerald-300 animate-pulse" />
            ) : isListening ? (
              <div className="relative">
                <Mic className="w-12 h-12 text-cyan-200 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </div>
            ) : isWakeWordActive ? (
              <Radio className="w-11 h-11 text-blue-400 animate-pulse" />
            ) : (
              <div className="relative group-hover:scale-110 transition-transform">
                <Mic className="w-11 h-11 text-cyan-400/80" />
              </div>
            )}

            {/* Reactor Core Label */}
            <span
              className="mt-1 text-[11px] font-mono tracking-widest font-semibold uppercase text-cyan-300/90"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {isProcessing
                ? 'AI CORE'
                : isSpeaking
                ? 'SPEAKING'
                : isListening
                ? 'LISTENING'
                : isWakeWordActive
                ? 'ARMED'
                : 'MIRROR'}
            </span>
          </div>

          {/* Audio Visualizer Spectrum Waveform Bars (Around inner center) */}
          <div className="absolute inset-x-4 bottom-3 flex items-end justify-center gap-1 h-3 pointer-events-none">
            {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7].map((heightRatio, idx) => {
              const barHeight =
                isListening || isSpeaking
                  ? Math.max(3, Math.round(12 * heightRatio * (0.3 + audioLevel * 0.8)))
                  : 2;
              return (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    isSpeaking
                      ? 'bg-emerald-400'
                      : isListening
                      ? 'bg-cyan-300'
                      : 'bg-cyan-800/40'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Futuristic Status Badge & Prompt Hint */}
      <div className="mt-2 flex flex-col items-center gap-1.5 text-center">
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-mono font-medium backdrop-blur-md transition-all shadow-sm ${statusColor}`}
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isListening ? 'bg-cyan-400' : isSpeaking ? 'bg-emerald-400' : 'bg-blue-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isListening ? 'bg-cyan-500' : isSpeaking ? 'bg-emerald-500' : 'bg-blue-500'
              }`}
            />
          </span>
          <span className={language === 'ur' ? "font-['Noto_Nastaliq_Urdu'] text-[13px]" : ''}>
            {statusText}
          </span>
        </div>

        <p className="text-[12px] text-cyan-200/60 font-mono tracking-wide">
          {language === 'ur'
            ? 'آواز شروع کرنے کے لیے کور کو چھوئیں یا "Hey Mirror" بولیں'
            : 'Tap Core to Speak or say "Hey Mirror"'}
        </p>
      </div>
    </div>
  );
};
