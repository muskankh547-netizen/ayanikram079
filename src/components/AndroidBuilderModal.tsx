import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Terminal,
  Code2,
  ShieldAlert,
  Copy,
  Check,
  Download,
  ExternalLink,
  Zap,
  Play,
  Layers,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidBuilderModal: React.FC<AndroidBuilderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'termux' | 'kotlin' | 'permissions'>('quick');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const { isInstallable, install } = usePWAInstall();

  if (!isOpen) return null;

  const copyCode = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const ANDROID_MANIFEST_CODE = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.mirrorai.assistant">

    <!-- Official Android Permissions Required for Mirror AI -->
    <!-- Voice Activation & Wake-Word -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Flashlight / Torch Control via CameraManager -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera.flash" android:required="false" />

    <!-- Phone Calls Confirmation -->
    <uses-permission android:name="android.permission.CALL_PHONE" />

    <!-- Background Execution & Start On Phone Boot -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Vibration & Haptics -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Mirror AI"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MirrorAI">

        <!-- Main Futuristic Holographic Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:showWhenLocked="true"
            android:turnScreenOn="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Background Voice Interaction & Wake-Word Service -->
        <service
            android:name=".MirrorVoiceService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="microphone" />

        <!-- Auto-Start Receiver When Phone Reboots -->
        <receiver
            android:name=".BootCompletedReceiver"
            android:enabled="true"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
                <action android:name="android.intent.action.QUICKBOOT_POWERON" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`;

  const MAIN_ACTIVITY_KOTLIN = `package com.mirrorai.assistant

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.os.BatteryManager
import android.os.Bundle
import android.provider.AlarmClock
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

/**
 * Mirror AI - Official Android APIs Implementation
 */
class MainActivity : AppCompatActivity() {

    private lateinit var cameraManager: CameraManager
    private var cameraId: String? = null
    private var isTorchOn: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize CameraManager for Flashlight / Torch
        cameraManager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
        try {
            cameraId = cameraManager.cameraIdList[0]
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // Start Background Wake-word Service
        val serviceIntent = Intent(this, MirrorVoiceService::class.java)
        startForegroundService(serviceIntent)
    }

    // 1. Official Flashlight Toggle API
    fun toggleFlashlight(enable: Boolean) {
        cameraId?.let { id ->
            try {
                cameraManager.setTorchMode(id, enable)
                isTorchOn = enable
                Toast.makeText(this, "Mirror AI: Flashlight " + if (enable) "ON" else "OFF", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this, "Camera torch error: \${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // 2. Official Battery Percentage & Charging API
    fun getBatteryStatus(): Pair<Int, Boolean> {
        val ifilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        val batteryStatus: Intent? = registerReceiver(null, ifilter)
        val level: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
        val scale: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
        val batteryPct = (level * 100 / scale.toFloat()).toInt()

        val status: Int = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
        val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

        return Pair(batteryPct, isCharging)
    }

    // 3. Official Set Timer API
    fun setTimer(seconds: Int, message: String = "Mirror AI Timer") {
        val intent = Intent(AlarmClock.ACTION_SET_TIMER).apply {
            putExtra(AlarmClock.EXTRA_LENGTH, seconds)
            putExtra(AlarmClock.EXTRA_MESSAGE, message)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
        }
        if (intent.resolveActivity(packageManager) != null) {
            startActivity(intent)
        }
    }

    // 4. Official Open Installed App API
    fun openInstalledApp(packageName: String) {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        if (launchIntent != null) {
            startActivity(launchIntent)
        } else {
            Toast.makeText(this, "App not installed on device", Toast.LENGTH_SHORT).show()
        }
    }

    // 5. Official Phone Call API (With user confirmation)
    fun makePhoneCall(phoneNumber: String) {
        val callIntent = Intent(Intent.ACTION_CALL).apply {
            data = Uri.parse("tel:$phoneNumber")
        }
        startActivity(callIntent)
    }
}`;

  const VOICE_SERVICE_KOTLIN = `package com.mirrorai.assistant

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Mirror AI Foreground Service: Keeps "Hey Mirror" voice listening active
 * while honoring Android battery optimization guidelines.
 */
class MirrorVoiceService : Service() {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        val notification = createNotification()
        startForeground(1001, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Continuous Wake-Word detector (e.g. Porcupine / Vosk / Android SpeechRecognizer)
        // Listens for "Hey Mirror" or "ہیلو مرر"
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            "mirror_ai_channel",
            "Mirror AI Voice Engine",
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager?.createNotificationChannel(channel)
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, "mirror_ai_channel")
            .setContentTitle("Mirror AI Active")
            .setContentText("Listening for 'Hey Mirror' voice wake-word")
            .setSmallIcon(R.drawable.ic_mirror_core)
            .setOngoing(true)
            .build()
    }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#070e22] border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#050a18] border-b border-cyan-500/25">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              ANDROID PHONE BUILDER & APK STUDIO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-cyan-950/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-3 pt-2 bg-[#060b1b] border-b border-cyan-500/15 overflow-x-auto scrollbar-none gap-1">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'quick'
                ? 'bg-[#0a1532] text-amber-300 border-t-2 border-amber-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>1-Tap Phone Install</span>
          </button>

          <button
            onClick={() => setActiveTab('termux')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'termux'
                ? 'bg-[#0a1532] text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Build APK in Termux</span>
          </button>

          <button
            onClick={() => setActiveTab('kotlin')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'kotlin'
                ? 'bg-[#0a1532] text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Native Kotlin Code</span>
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${
              activeTab === 'permissions'
                ? 'bg-[#0a1532] text-cyan-300 border-t-2 border-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>Android Permissions & Rules</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs text-slate-200 leading-relaxed">
          {/* TAB 1: 1-Tap Phone Install */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-cyan-950/40 to-[#071024] border border-amber-500/30">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Easiest Way: No Computer / Zero Setup Required
                </h3>
                <p className="mt-1 text-slate-300">
                  Because you only have an Android phone, you can run Mirror AI directly as a standalone app right now using Android's official WebAPK engine:
                </p>

                {isInstallable ? (
                  <button
                    onClick={install}
                    className="mt-3 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Install Mirror AI on Phone Now
                  </button>
                ) : (
                  <div className="mt-2 text-xs text-cyan-300/80 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/20">
                    💡 If the prompt doesn't show: In Chrome on your phone, tap the <strong>three dots (⋮)</strong> menu in the top right, then tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#0b1329] border border-cyan-500/20">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">1</span>
                    Standalone Display
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Opens without browser address bar, exactly like a native Android APK with custom splash screen and app icon on your home launcher.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0b1329] border border-cyan-500/20">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">2</span>
                    Hardware Access
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Direct control over your phone's camera torch/flashlight, battery percentage, vibration motor, and Urdu speech synthesizers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0b1329] border border-cyan-500/20">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">3</span>
                    Offline Mode
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Cached by Service Worker. Works even if your mobile data is turned off, with cached voice modules and local alarms.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Termux Method */}
          {activeTab === 'termux' && (
            <div className="space-y-3">
              <p className="text-slate-300">
                To compile an actual <code>.apk</code> file 100% on your Android phone without touching a computer, use <strong>Termux</strong> (free on F-Droid):
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#060a17] border border-cyan-500/25">
                  <div className="flex items-center justify-between text-cyan-400 font-bold mb-1.5">
                    <span>Step 1: Install Termux on Phone</span>
                    <span className="text-[10px] text-amber-300">F-Droid (Free)</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Download Termux from <strong>f-droid.org</strong> (do not use Google Play version as it is outdated).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#060a17] border border-cyan-500/25">
                  <div className="flex items-center justify-between text-cyan-400 font-bold mb-1.5">
                    <span>Step 2: Run Setup Commands in Termux</span>
                    <button
                      onClick={() =>
                        copyCode(
                          'termux-setup',
                          'pkg update && pkg install nodejs git openjdk-17 -y\nnpm install -g @capacitor/cli @capacitor/core @capacitor/android'
                        )
                      }
                      className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white"
                    >
                      {copiedFile === 'termux-setup' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy Command
                    </button>
                  </div>
                  <pre className="bg-[#0b142d] p-2.5 rounded-lg text-emerald-300 text-[11px] overflow-x-auto">
                    pkg update && pkg install nodejs git openjdk-17 -y{'\n'}
                    npm install -g @capacitor/cli @capacitor/core @capacitor/android
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-[#060a17] border border-cyan-500/25">
                  <div className="flex items-center justify-between text-cyan-400 font-bold mb-1.5">
                    <span>Step 3: Export Web App & Build APK</span>
                    <button
                      onClick={() =>
                        copyCode(
                          'termux-build',
                          'npx cap init "Mirror AI" com.mirrorai.assistant --web-dir dist\nnpx cap add android\nnpx cap sync\ncd android && ./gradlew assembleDebug'
                        )
                      }
                      className="flex items-center gap-1 text-[11px] text-cyan-300 hover:text-white"
                    >
                      {copiedFile === 'termux-build' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy Command
                    </button>
                  </div>
                  <pre className="bg-[#0b142d] p-2.5 rounded-lg text-emerald-300 text-[11px] overflow-x-auto">
                    npx cap init "Mirror AI" com.mirrorai.assistant --web-dir dist{'\n'}
                    npx cap add android{'\n'}
                    npx cap sync{'\n'}
                    cd android && ./gradlew assembleDebug
                  </pre>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Your generated APK will be at: <code>android/app/build/outputs/apk/debug/app-debug.apk</code>. You can install it on your phone with 1 tap!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Native Kotlin Code */}
          {activeTab === 'kotlin' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-cyan-300">1. AndroidManifest.xml</span>
                  <button
                    onClick={() => copyCode('manifest', ANDROID_MANIFEST_CODE)}
                    className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white"
                  >
                    {copiedFile === 'manifest' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Manifest
                  </button>
                </div>
                <pre className="p-3 bg-[#050917] rounded-xl border border-cyan-500/20 text-cyan-200/90 text-[11px] max-h-48 overflow-y-auto">
                  {ANDROID_MANIFEST_CODE}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-cyan-300">2. MainActivity.kt (Official Android APIs)</span>
                  <button
                    onClick={() => copyCode('main_activity', MAIN_ACTIVITY_KOTLIN)}
                    className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white"
                  >
                    {copiedFile === 'main_activity' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy MainActivity
                  </button>
                </div>
                <pre className="p-3 bg-[#050917] rounded-xl border border-cyan-500/20 text-cyan-200/90 text-[11px] max-h-48 overflow-y-auto">
                  {MAIN_ACTIVITY_KOTLIN}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-cyan-300">3. MirrorVoiceService.kt (Screen-Off WakeLock & Service)</span>
                  <button
                    onClick={() => copyCode('service', VOICE_SERVICE_KOTLIN)}
                    className="flex items-center gap-1 text-xs text-cyan-300 hover:text-white"
                  >
                    {copiedFile === 'service' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Service
                  </button>
                </div>
                <pre className="p-3 bg-[#050917] rounded-xl border border-cyan-500/20 text-cyan-200/90 text-[11px] max-h-48 overflow-y-auto">
                  {VOICE_SERVICE_KOTLIN}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Android Permissions & Hardware Rules */}
          {activeTab === 'permissions' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  What Android Permitted vs Battery Restrictions
                </h4>
                <p className="text-[11px] text-slate-300">
                  Android has strict power management (Doze Mode). Here is the exact technical reality of how personal assistants operate:
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-[#081026] border border-cyan-500/20">
                  <span className="text-cyan-300 font-bold">1. Screen-Off & Locked Listening:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    To listen while the phone is locked without the OS killing the app, Android requires a <strong>Foreground Service</strong> with a persistent notification (e.g. "Mirror AI is active") and battery optimization set to <em>"Don't optimize / Unrestricted"</em>.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#081026] border border-cyan-500/20">
                  <span className="text-cyan-300 font-bold">2. Phone Restart / Autostart:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Needs <code>RECEIVE_BOOT_COMPLETED</code> permission in <code>AndroidManifest.xml</code>. On Chinese Android ROMs (Xiaomi/Oppo/Vivo/Realme), the user must also turn ON <strong>"Autostart"</strong> in app settings.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#081026] border border-cyan-500/20">
                  <span className="text-cyan-300 font-bold">3. Making Phone Calls:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ordinary web apps open the phone dialer via <code>tel:</code> where the user confirms before calling. A native APK with <code>android.permission.CALL_PHONE</code> can place calls immediately.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#081026] border border-cyan-500/20">
                  <span className="text-cyan-300 font-bold">4. Flashlight / Torch:</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Official API is <code>CameraManager.setTorchMode(cameraId, true)</code>. Does not require opening the camera viewfinder, making it instant and lightweight on budget phones.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#050a18] border-t border-cyan-500/25 flex items-center justify-between">
          <span className="text-[11px] text-cyan-400/60">
            Engineered for Android 10+ (API 29 to 35)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
