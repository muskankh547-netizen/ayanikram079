import React, { useState } from 'react';
import { Volume2, Terminal, Send, Zap, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { voiceService, AssistantLanguage } from '../services/voiceService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: 'en' | 'ur';
  action?: {
    type: string;
    details?: string;
    success?: boolean;
  };
  timestamp: string;
}

interface TerminalLogProps {
  messages: ChatMessage[];
  interimTranscript: string;
  isListening: boolean;
  onSendTextCommand: (text: string) => void;
  language: AssistantLanguage;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({
  messages,
  interimTranscript,
  isListening,
  onSendTextCommand,
  language,
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendTextCommand(inputText.trim());
    setInputText('');
  };

  const quickPrompts =
    language === 'ur'
      ? [
          'بیٹری کا اسٹیٹس کیا ہے؟',
          'فلیش لائٹ آن کرو',
          'یوٹیوب کھولیں',
          'ڈرائنگ روم کی لائٹس آن کرو',
          '3 منٹ کا ٹائمر لگاؤ',
          'پاکستان میں وقت کیا ہے؟',
        ]
      : [
          "What's my battery percentage?",
          'Turn on the flashlight',
          'Open YouTube',
          'Set a 5 minute timer',
          'Turn on living room lights',
          'Tell me a witty quote, Mirror',
        ];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col bg-[#081024]/75 backdrop-blur-md border border-cyan-500/25 rounded-2xl shadow-xl overflow-hidden transition-all">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#060c1d] border-b border-cyan-500/20 text-xs font-mono">
        <div className="flex items-center gap-2 text-cyan-300">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold tracking-wider">NEURAL HUD FEED</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[10px] text-cyan-400/70 font-mono">EN/UR DUAL CORE</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-3.5 space-y-3 max-h-72 overflow-y-auto font-mono text-xs scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
        {messages.length === 0 && !interimTranscript && (
          <div className="text-center py-6 text-cyan-400/50">
            <p className="text-xs">
              {language === 'ur'
                ? 'مرر اے آئی تیار ہے۔ بولیں "Hey Mirror" یا نیچے دیے گئے بٹن آزمائیں'
                : 'Mirror AI neural link standby. Speak "Hey Mirror" or choose a prompt below.'}
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUrdu = msg.language === 'ur' || /[\u0600-\u06FF]/.test(msg.content);
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-xl px-3.5 py-2.5 transition-all shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border border-cyan-500/30 text-cyan-100'
                    : msg.role === 'system'
                    ? 'bg-amber-950/40 border border-amber-500/30 text-amber-200'
                    : 'bg-[#0c1630]/90 border border-cyan-500/25 text-slate-100'
                }`}
              >
                {/* Header tag */}
                <div className="flex items-center justify-between gap-2 mb-1 text-[10px] opacity-70">
                  <span className="font-bold uppercase tracking-wider text-cyan-400">
                    {msg.role === 'user' ? 'YOU' : 'MIRROR AI'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Content */}
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    isUrdu ? "font-['Noto_Nastaliq_Urdu'] text-right text-base leading-loose" : ''
                  }`}
                  dir={isUrdu ? 'rtl' : 'ltr'}
                >
                  {msg.content}
                </p>

                {/* Executed Action Badge */}
                {msg.action && (
                  <div className="mt-2 pt-1.5 border-t border-cyan-500/20 flex items-center gap-1.5 text-[11px] text-cyan-300">
                    {msg.action.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="font-semibold">{msg.action.type}:</span>
                    <span className="opacity-80">{msg.action.details}</span>
                  </div>
                )}

                {/* Read aloud trigger button for assistant message */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => voiceService.speak(msg.content, msg.language || (isUrdu ? 'ur' : 'en'))}
                    className="mt-1.5 text-[10px] text-cyan-400/80 hover:text-cyan-200 flex items-center gap-1 underline-offset-2 hover:underline"
                    title="Speak this response aloud"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Repeat Audio</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Real-time Voice Transcription Stream */}
        {isListening && interimTranscript && (
          <div className="flex flex-col items-end animate-pulse">
            <div className="max-w-[85%] rounded-xl px-3.5 py-2 bg-cyan-950/40 border border-cyan-400/40 text-cyan-200 italic text-xs">
              <span className="text-[10px] text-cyan-400 not-italic block mb-0.5">HEARING:</span>
              "{interimTranscript}..."
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-3 py-2 bg-[#050b1c] border-t border-cyan-500/15 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mr-1" />
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSendTextCommand(prompt)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/25 hover:border-cyan-400/50 text-[11px] text-cyan-200 transition-all active:scale-95 shrink-0"
          >
            <span>{prompt}</span>
            <ChevronRight className="w-2.5 h-2.5 text-cyan-400 opacity-60" />
          </button>
        ))}
      </div>

      {/* Text Command Form (For Silent / Testing Environments) */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-[#060c1d] border-t border-cyan-500/20 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            language === 'ur'
              ? 'یہاں تحریر کریں یا مائیکروفون دبائیں...'
              : 'Type command or tap Core above to speak...'
          }
          className="flex-1 bg-[#0c1630] border border-cyan-500/30 rounded-xl px-3.5 py-2 text-xs text-white placeholder-cyan-400/40 focus:outline-none focus:border-cyan-400 font-mono transition-colors"
          dir={language === 'ur' ? 'rtl' : 'ltr'}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          title="Send command to Mirror AI"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Run</span>
        </button>
      </form>
    </div>
  );
};
