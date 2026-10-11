import React, { useState, useEffect, useRef } from 'react';
import { ArcReactorCore } from './components/ArcReactorCore';
import { HeaderHUD } from './components/HeaderHUD';
import { TerminalLog, ChatMessage } from './components/TerminalLog';
import { QuickControlDock } from './components/QuickControlDock';
import { AndroidBuilderModal } from './components/AndroidBuilderModal';
import { TimersAlarmsModal, ActiveTimer, ScheduledAlarm } from './components/TimersAlarmsModal';
import { SmartLightsModal } from './components/SmartLightsModal';
import { AppLauncherModal } from './components/AppLauncherModal';
import { BatteryInfoModal } from './components/BatteryInfoModal';
import { SettingsModal } from './components/SettingsModal';
import { voiceService, VoiceState, AssistantLanguage } from './services/voiceService';
import { androidSystem, BatteryInfo, DeviceTelemetry } from './services/androidSystem';
import { smartLights, SmartLightRoom } from './services/smartLights';
import { soundFx } from './services/soundEffects';
import { Flashlight, X } from 'lucide-react';

export default function App() {
  // Voice engine state
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isSupported: true,
    isListening: false,
    isSpeaking: false,
    isWakeWordActive: false,
    transcript: '',
    interimTranscript: '',
    language: 'en',
    audioLevel: 0,
  });

  // User Settings & Language
  const [language, setLanguage] = useState<AssistantLanguage>('en');
  const [userName, setUserName] = useState<string>('Fahad');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Phone Controls & Telemetry
  const [battery, setBattery] = useState<BatteryInfo>({
    supported: true,
    level: 85,
    charging: false,
    chargingTime: 0,
    dischargingTime: 0,
  });
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(androidSystem.getDeviceTelemetry());
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [showScreenTorch, setShowScreenTorch] = useState(false);

  // Smart Lights
  const [rooms, setRooms] = useState<SmartLightRoom[]>(smartLights.getRooms());

  // Timers & Alarms
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([
    {
      id: 'default-timer',
      label: 'Tea Timer',
      totalSeconds: 180,
      remainingSeconds: 180,
      isRunning: false,
    },
  ]);
  const [alarms, setAlarms] = useState<ScheduledAlarm[]>([
    {
      id: 'default-alarm',
      timeStr: '07:00',
      period: 'AM',
      label: 'Wake Up Mirror AI',
      enabled: true,
    },
  ]);

  // Modals Visibility
  const [isAndroidBuilderOpen, setIsAndroidBuilderOpen] = useState(false);
  const [isTimersOpen, setIsTimersOpen] = useState(false);
  const [isSmartLightsOpen, setIsSmartLightsOpen] = useState(false);
  const [isAppLauncherOpen, setIsAppLauncherOpen] = useState(false);
  const [isBatteryInfoOpen, setIsBatteryInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load Saved Preferences on Mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('mirror_user_name');
      if (savedUser) setUserName(savedUser);

      const savedLang = localStorage.getItem('mirror_language') as AssistantLanguage;
      if (savedLang) {
        setLanguage(savedLang);
        voiceService.setLanguage(savedLang);
      }
    } catch {}

    // Initial Telemetry & Battery query
    androidSystem.getBatteryStatus().then((b) => setBattery(b));
    setTelemetry(androidSystem.getDeviceTelemetry());

    // Subscribe to Voice State changes
    const unsubscribeVoice = voiceService.subscribe((state) => {
      setVoiceState(state);
    });

    // Wire up Voice Command Processing callback
    voiceService.setCommandCallback((commandText, detectedLang) => {
      handleProcessCommand(commandText, detectedLang);
    });

    // Battery change event listener if available
    // @ts-expect-error navigator.getBattery
    if (typeof navigator !== 'undefined' && navigator.getBattery) {
      // @ts-expect-error navigator.getBattery
      navigator.getBattery().then((b: any) => {
        const update = () => {
          setBattery({
            supported: true,
            level: Math.round(b.level * 100),
            charging: b.charging,
            chargingTime: b.chargingTime,
            dischargingTime: b.dischargingTime,
          });
        };
        b.addEventListener('chargingchange', update);
        b.addEventListener('levelchange', update);
      }).catch(() => {});
    }

    // Welcoming greeting
    const isUrdu = language === 'ur';
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: isUrdu
        ? `السلام علیکم ${userName}! مرر اے آئی مکمل فعال ہے۔ آپ کی کیا خدمت کروں؟`
        : `Greetings ${userName}. Mirror AI online and synchronized. How may I assist you?`,
      language: isUrdu ? 'ur' : 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcomeMessage]);

    return () => {
      unsubscribeVoice();
    };
  }, []);

  // Timer Tick Engine: Runs every second
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setActiveTimers((prev) =>
        prev.map((t) => {
          if (!t.isRunning) return t;
          if (t.remainingSeconds <= 1) {
            // Timer expired!
            soundFx.playAlarmBuzzer();
            androidSystem.vibrate([200, 100, 200, 100, 400]);
            voiceService.speak(
              language === 'ur'
                ? `ٹائمر مکمل ہو گیا ہے: ${t.label}`
                : `Timer complete: ${t.label}!`,
              language === 'ur' ? 'ur' : 'en'
            );
            return { ...t, remainingSeconds: 0, isRunning: false };
          }
          return { ...t, remainingSeconds: t.remainingSeconds - 1 };
        })
      );
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [language]);

  // Main Command Handler: Communicates with server /api/mirror/chat and triggers actions
  const handleProcessCommand = async (rawCommand: string, langHint?: 'en' | 'ur') => {
    if (!rawCommand.trim() || isProcessing) return;

    soundFx.playClick();
    androidSystem.vibrate(40);

    const targetLang = langHint || (language === 'auto' ? (rawCommand.match(/[\u0600-\u06FF]/) ? 'ur' : 'en') : language);
    const userMsgId = Date.now().toString();
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append User message to HUD
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: rawCommand,
      language: targetLang,
      timestamp: timestampStr,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Refresh current battery and context before dispatching
      const freshBattery = await androidSystem.getBatteryStatus();
      setBattery(freshBattery);

      const response = await fetch('/api/mirror/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: rawCommand,
          language: targetLang,
          userName,
          deviceContext: {
            batteryLevel: freshBattery.level,
            isCharging: freshBattery.charging,
            flashlightOn: isTorchOn,
            online: navigator.onLine,
            currentTime: new Date().toLocaleTimeString(),
          },
          conversationHistory: messages.slice(-5).map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.reply || (targetLang === 'ur' ? 'جی جناب، میں نے سن لیا ہے۔' : 'Command acknowledged, Boss.');
      const replyLang = data.language || targetLang;
      const action = data.action;

      let actionRecord: ChatMessage['action'] | undefined = undefined;

      // Execute physical or mobile actions
      if (action && action.type) {
        switch (action.type) {
          case 'TOGGLE_FLASHLIGHT': {
            const desiredState =
              action.flashlightState === 'on'
                ? true
                : action.flashlightState === 'off'
                ? false
                : !isTorchOn;
            const res = await androidSystem.setTorch(desiredState);
            setIsTorchOn(desiredState);
            if (res.usingScreenFallback && desiredState) {
              setShowScreenTorch(true);
            }
            soundFx.playSuccess();
            actionRecord = {
              type: 'Flashlight',
              details: desiredState ? 'Hardware Torch ON' : 'Hardware Torch OFF',
              success: true,
            };
            break;
          }

          case 'CHECK_BATTERY': {
            actionRecord = {
              type: 'Battery Status',
              details: `${freshBattery.level}% ${freshBattery.charging ? '(Charging)' : ''}`,
              success: true,
            };
            break;
          }

          case 'SET_TIMER': {
            const secs = action.timerSeconds || 300;
            const label = action.timerLabel || 'Voice Timer';
            setActiveTimers((prev) => [
              {
                id: Date.now().toString(),
                label,
                totalSeconds: secs,
                remainingSeconds: secs,
                isRunning: true,
              },
              ...prev,
            ]);
            soundFx.playSuccess();
            actionRecord = {
              type: 'Timer Set',
              details: `${Math.round(secs / 60)} min (${label})`,
              success: true,
            };
            break;
          }

          case 'SET_ALARM': {
            const timeStr = action.alarmTime || '07:00 AM';
            setAlarms((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                timeStr,
                period: timeStr.includes('PM') ? 'PM' : 'AM',
                label: 'Voice Alarm',
                enabled: true,
              },
            ]);
            soundFx.playSuccess();
            actionRecord = {
              type: 'Alarm Set',
              details: timeStr,
              success: true,
            };
            break;
          }

          case 'OPEN_APP': {
            const targetApp = action.appTarget || 'youtube';
            const launchRes = androidSystem.launchApp(targetApp);
            actionRecord = {
              type: 'App Launch',
              details: launchRes.appName,
              success: launchRes.success,
            };
            break;
          }

          case 'CONTROL_LIGHTS': {
            const roomTarget = action.lightsTarget || 'living_room';
            const state = action.lightsState;
            if (state === 'off') {
              smartLights.setRoomState(roomTarget, { isOn: false });
            } else {
              smartLights.setRoomState(roomTarget, { isOn: true });
            }
            setRooms(smartLights.getRooms());
            soundFx.playSuccess();
            actionRecord = {
              type: 'Smart Lights',
              details: `${roomTarget.replace('_', ' ')} ${state === 'off' ? 'OFF' : 'ON'}`,
              success: true,
            };
            break;
          }

          case 'MAKE_CALL': {
            const contact = action.contactTarget || '';
            window.location.href = `tel:${encodeURIComponent(contact)}`;
            actionRecord = {
              type: 'Phone Call',
              details: `Dialer: ${contact}`,
              success: true,
            };
            break;
          }

          case 'DEVICE_INFO': {
            setIsBatteryInfoOpen(true);
            actionRecord = {
              type: 'Device Info',
              details: 'Displaying telemetry stats',
              success: true,
            };
            break;
          }
        }
      }

      // Append Assistant reply
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: replyText,
        language: replyLang,
        action: actionRecord,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Speak back aloud
      await voiceService.speak(replyText, replyLang);
    } catch (err) {
      console.error('Error processing command:', err);
      soundFx.playError();
      const failText =
        targetLang === 'ur'
          ? 'معذرت، کمانڈ مکمل کرنے میں دشواری پیش آئی ہے۔'
          : 'Unable to synchronize command with core. Standby for retry.';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: failText,
          language: targetLang,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      await voiceService.speak(failText, targetLang);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Hardware Torch / Flashlight
  const handleToggleTorch = async () => {
    const nextState = !isTorchOn;
    soundFx.playClick();
    const res = await androidSystem.setTorch(nextState);
    setIsTorchOn(nextState);
    if (res.usingScreenFallback && nextState) {
      setShowScreenTorch(true);
    }
    const notice = nextState ? 'Flashlight ON' : 'Flashlight OFF';
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'system',
        content: `⚡ ${notice}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Toggle Voice Listening via Arc Reactor Core click
  const handleToggleListen = () => {
    if (voiceState.isListening) {
      voiceService.stopListening();
    } else {
      voiceService.startListening();
    }
  };

  // Toggle "Hey Mirror" continuous wake-word standby
  const handleToggleWakeWord = () => {
    voiceService.toggleWakeWord();
  };

  // Language Change handler
  const handleLanguageChange = (newLang: AssistantLanguage) => {
    setLanguage(newLang);
    voiceService.setLanguage(newLang);
    localStorage.setItem('mirror_language', newLang);
    soundFx.playClick();
  };

  // Refresh Telemetry
  const handleRefreshTelemetry = async () => {
    const b = await androidSystem.getBatteryStatus();
    setBattery(b);
    setTelemetry(androidSystem.getDeviceTelemetry());
    soundFx.playSuccess();
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* High-Intensity Screen Torch Overlay (When activated or camera torch restricted) */}
      {showScreenTorch && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6 animate-fadeIn">
          <div className="w-full flex justify-end">
            <button
              onClick={() => {
                setShowScreenTorch(false);
                handleToggleTorch();
              }}
              className="p-3 rounded-full bg-slate-900/80 text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="text-center text-slate-950 font-bold font-mono">
            <Flashlight className="w-16 h-16 mx-auto mb-2 text-amber-500 animate-pulse" />
            <h2 className="text-2xl">HIGH BEAM SCREEN TORCH</h2>
            <p className="text-sm text-slate-700 mt-1">Screen at maximum brightness</p>
          </div>
          <button
            onClick={() => {
              setShowScreenTorch(false);
              handleToggleTorch();
            }}
            className="w-full max-w-xs py-3 rounded-2xl bg-slate-900 text-white font-mono font-bold text-sm shadow-xl active:scale-95 transition-all"
          >
            Turn Torch Off
          </button>
        </div>
      )}

      {/* Futuristic Header HUD */}
      <HeaderHUD
        battery={battery}
        language={language}
        onLanguageChange={handleLanguageChange}
        isWakeWordActive={voiceState.isWakeWordActive}
        onToggleWakeWord={handleToggleWakeWord}
        onOpenAndroidBuilder={() => setIsAndroidBuilderOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 pt-2 pb-24 flex flex-col items-center justify-start gap-2">
        {/* Glowing Holographic Arc Reactor Core */}
        <ArcReactorCore
          voiceState={voiceState}
          isProcessing={isProcessing}
          onToggleListen={handleToggleListen}
          language={language}
        />

        {/* Live HUD Terminal Feed & Transcription */}
        <TerminalLog
          messages={messages}
          interimTranscript={voiceState.interimTranscript}
          isListening={voiceState.isListening}
          onSendTextCommand={(cmd) => handleProcessCommand(cmd)}
          language={language}
        />
      </main>

      {/* Bottom Floating Mobile Quick Control Dock */}
      <QuickControlDock
        isTorchOn={isTorchOn}
        onToggleTorch={handleToggleTorch}
        onOpenTimers={() => setIsTimersOpen(true)}
        onOpenSmartLights={() => setIsSmartLightsOpen(true)}
        onOpenAppLauncher={() => setIsAppLauncherOpen(true)}
        onOpenBatteryInfo={() => setIsBatteryInfoOpen(true)}
        onOpenAndroidBuilder={() => setIsAndroidBuilderOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        batteryLevel={battery.level}
      />

      {/* Modals */}
      <AndroidBuilderModal
        isOpen={isAndroidBuilderOpen}
        onClose={() => setIsAndroidBuilderOpen(false)}
      />

      <TimersAlarmsModal
        isOpen={isTimersOpen}
        onClose={() => setIsTimersOpen(false)}
        activeTimers={activeTimers}
        setActiveTimers={setActiveTimers}
        alarms={alarms}
        setAlarms={setAlarms}
      />

      <SmartLightsModal
        isOpen={isSmartLightsOpen}
        onClose={() => setIsSmartLightsOpen(false)}
        rooms={rooms}
        onRoomsUpdate={(r) => setRooms(r)}
        language={language}
      />

      <AppLauncherModal
        isOpen={isAppLauncherOpen}
        onClose={() => setIsAppLauncherOpen(false)}
        language={language}
        onAppLaunched={(name, notice) => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'system',
              content: `📱 ${notice}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }}
      />

      <BatteryInfoModal
        isOpen={isBatteryInfoOpen}
        onClose={() => setIsBatteryInfoOpen(false)}
        battery={battery}
        telemetry={telemetry}
        onRefresh={handleRefreshTelemetry}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={{
          userName,
          assistantName: 'Mirror AI',
          defaultLanguage: language,
          speechRate: 1.0,
          autoSpeakResponse: true,
          hapticFeedback: true,
        }}
        onSaveSettings={(s) => {
          setUserName(s.userName);
          localStorage.setItem('mirror_user_name', s.userName);
          handleLanguageChange(s.defaultLanguage);
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
}
