/**
 * Voice Recognition & Speech Synthesis Engine for Mirror AI
 * Supports English & Urdu Speech Recognition, Wake-word continuous listening,
 * SpeechSynthesis audio output, and Web Audio frequency analyser.
 */

import { soundFx } from './soundEffects';

export type AssistantLanguage = 'en' | 'ur' | 'auto';

export interface VoiceState {
  isSupported: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isWakeWordActive: boolean;
  transcript: string;
  interimTranscript: string;
  language: AssistantLanguage;
  audioLevel: number; // 0 to 1
}

type VoiceStateListener = (state: VoiceState) => void;
type CommandCallback = (commandText: string, language: 'en' | 'ur') => void;

class VoiceService {
  private recognition: any = null;
  private synth: SpeechSynthesis | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  private state: VoiceState = {
    isSupported: false,
    isListening: false,
    isSpeaking: false,
    isWakeWordActive: false,
    transcript: '',
    interimTranscript: '',
    language: 'en',
    audioLevel: 0,
  };

  private stateListeners: Set<VoiceStateListener> = new Set();
  private onCommandCallback: CommandCallback | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Check SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.state.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.setupRecognitionListeners();
    }

    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  private setupRecognitionListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.updateState({ isListening: true });
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        const text = item[0].transcript;
        if (item.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      this.updateState({
        interimTranscript: interim,
        transcript: final || interim,
      });

      // Detect wake word if in wake-word standby mode
      const rawText = (final || interim).toLowerCase();
      const wakeKeywords = ['hey mirror', 'mirror', 'ہیلو مرر', 'سنو مرر', 'مرر اے آئی', 'مرر'];
      const hasWakeWord = wakeKeywords.some((w) => rawText.includes(w));

      if (this.state.isWakeWordActive && hasWakeWord && !final) {
        soundFx.playWakeChime();
      }

      if (final.trim()) {
        const detectedLang = /[\u0600-\u06FF]/.test(final) ? 'ur' : 'en';
        if (this.onCommandCallback) {
          // Remove wake word prefix if present
          let cleanCommand = final;
          wakeKeywords.forEach((w) => {
            cleanCommand = cleanCommand.replace(new RegExp(w, 'gi'), '');
          });
          cleanCommand = cleanCommand.trim() || final.trim();

          this.onCommandCallback(cleanCommand, detectedLang);
        }
        this.updateState({ interimTranscript: '', transcript: '' });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('[VoiceService] Recognition error:', event.error);
      if (event.error !== 'no-speech') {
        this.updateState({ isListening: false });
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if wake-word mode is active
      if (this.state.isWakeWordActive) {
        try {
          this.recognition.start();
        } catch {
          this.updateState({ isListening: false });
        }
      } else {
        this.updateState({ isListening: false });
      }
    };
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => this.stateListeners.delete(listener);
  }

  private updateState(partial: Partial<VoiceState>) {
    this.state = { ...this.state, ...partial };
    this.stateListeners.forEach((l) => l(this.state));
  }

  public setLanguage(lang: AssistantLanguage) {
    this.updateState({ language: lang });
    if (this.recognition) {
      if (lang === 'ur') {
        this.recognition.lang = 'ur-PK';
      } else if (lang === 'en') {
        this.recognition.lang = 'en-US';
      } else {
        this.recognition.lang = 'en-US';
      }
    }
  }

  public setCommandCallback(cb: CommandCallback) {
    this.onCommandCallback = cb;
  }

  public async startListening() {
    if (!this.recognition) return;
    try {
      this.setLanguage(this.state.language);
      soundFx.playWakeChime();
      this.initAudioAnalyser();
      this.recognition.start();
    } catch {
      // Already running or not allowed
    }
  }

  public stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
      this.updateState({ isListening: false, isWakeWordActive: false });
      this.stopAudioAnalyser();
    } catch {}
  }

  public toggleWakeWord(enabled?: boolean) {
    const nextState = enabled !== undefined ? enabled : !this.state.isWakeWordActive;
    this.updateState({ isWakeWordActive: nextState });

    if (nextState) {
      soundFx.playWakeChime();
      this.startListening();
    } else {
      this.stopListening();
    }
  }

  /**
   * Speak response aloud with natural voice selection & audio feedback
   */
  public speak(text: string, lang: 'en' | 'ur' = 'en'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Select voice
      const voices = this.synth.getVoices();
      if (lang === 'ur') {
        utterance.lang = 'ur-PK';
        const urduVoice = voices.find((v) => v.lang.startsWith('ur') || v.lang.startsWith('ar'));
        if (urduVoice) utterance.voice = urduVoice;
        utterance.rate = 0.95;
      } else {
        utterance.lang = 'en-US';
        // Look for sleek futuristic/male voice or high-quality voice
        const enVoice =
          voices.find((v) => v.name.includes('Natural') || v.name.includes('Google UK English Male') || v.name.includes('Google US English') || v.name.includes('Daniel')) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
      }

      utterance.onstart = () => {
        this.updateState({ isSpeaking: true });
        this.simulateAudioActivity(true);
      };

      utterance.onend = () => {
        this.updateState({ isSpeaking: false, audioLevel: 0 });
        this.simulateAudioActivity(false);
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = () => {
        this.updateState({ isSpeaking: false, audioLevel: 0 });
        this.simulateAudioActivity(false);
        this.currentUtterance = null;
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.updateState({ isSpeaking: false, audioLevel: 0 });
      this.simulateAudioActivity(false);
      this.currentUtterance = null;
    }
  }

  /**
   * Setup Web Audio mic analyser to feed visualizer
   */
  private async initAudioAnalyser() {
    if (this.audioContext) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;

      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength / 255;
        this.updateState({ audioLevel: Math.min(1, avg * 1.8) });
        this.animFrameId = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Audio capture not permitted, fallback to visual animation
    }
  }

  private stopAudioAnalyser() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyser = null;
    }
  }

  private simulateInterval: number | null = null;
  private simulateAudioActivity(start: boolean) {
    if (this.simulateInterval) {
      clearInterval(this.simulateInterval);
      this.simulateInterval = null;
    }
    if (start) {
      this.simulateInterval = window.setInterval(() => {
        const rand = 0.3 + Math.random() * 0.65;
        this.updateState({ audioLevel: rand });
      }, 90);
    }
  }
}

export const voiceService = new VoiceService();
