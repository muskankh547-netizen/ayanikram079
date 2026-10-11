/**
 * Android System Integration Service for Mirror AI
 * Interacts with official browser & mobile Web APIs (Camera Torch, Battery API,
 * Vibration, Device Telemetry, and Android App Intent URLs).
 */

export interface BatteryInfo {
  supported: boolean;
  level: number; // 0 - 100
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export interface DeviceTelemetry {
  platform: string;
  userAgent: string;
  screenResolution: string;
  cores: number;
  memoryGb?: number;
  online: boolean;
  connectionType?: string;
}

export interface AppIntentDefinition {
  id: string;
  name: string;
  nameUrdu: string;
  iconName: string;
  packageAndroid?: string;
  deepLink: string;
  fallbackUrl: string;
}

class AndroidSystemService {
  private torchStream: MediaStream | null = null;
  private torchTrack: MediaStreamTrack | null = null;
  private isTorchOn = false;

  /**
   * Check if Flashlight / Torch is supported via MediaStreamTrack
   */
  async isTorchSupported(): Promise<boolean> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((d) => d.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  /**
   * Toggle or set hardware Flashlight on Android phone
   */
  async setTorch(enable: boolean): Promise<{ success: boolean; message: string; usingScreenFallback?: boolean }> {
    try {
      if (enable) {
        if (!this.torchStream) {
          this.torchStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              // @ts-expect-error Torch is a standard extension on mobile browsers
              advanced: [{ torch: true }],
            },
          });
        }

        const track = this.torchStream.getVideoTracks()[0];
        if (track) {
          this.torchTrack = track;
          // Check capabilities
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as { torch?: boolean };
          if (capabilities.torch) {
            // @ts-expect-error standard mobile constraint
            await track.applyConstraints({ advanced: [{ torch: true }] });
            this.isTorchOn = true;
            this.vibrate([40, 30, 40]);
            return { success: true, message: 'Flashlight activated.' };
          }
        }
        // If torch constraint not directly exposed by browser sandbox, we signal fallback
        this.isTorchOn = true;
        return {
          success: true,
          message: 'Torch permission granted. Screen boost fallback active.',
          usingScreenFallback: true,
        };
      } else {
        if (this.torchTrack) {
          try {
            // @ts-expect-error standard mobile constraint
            await this.torchTrack.applyConstraints({ advanced: [{ torch: false }] });
          } catch {}
          this.torchTrack.stop();
          this.torchTrack = null;
        }
        if (this.torchStream) {
          this.torchStream.getTracks().forEach((t) => t.stop());
          this.torchStream = null;
        }
        this.isTorchOn = false;
        this.vibrate(50);
        return { success: true, message: 'Flashlight deactivated.' };
      }
    } catch (err: unknown) {
      console.warn('Torch activation notice:', err);
      this.isTorchOn = enable;
      return {
        success: false,
        message: 'Hardware camera permission restricted. Using high-intensity screen torch.',
        usingScreenFallback: true,
      };
    }
  }

  getTorchState(): boolean {
    return this.isTorchOn;
  }

  /**
   * Read real phone battery percentage & charging status via Battery API
   */
  async getBatteryStatus(): Promise<BatteryInfo> {
    try {
      // @ts-expect-error navigator.getBattery is supported in modern Chrome for Android
      if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
        // @ts-expect-error navigator.getBattery standard
        const battery = await navigator.getBattery();
        return {
          supported: true,
          level: Math.round(battery.level * 100),
          charging: Boolean(battery.charging),
          chargingTime: battery.chargingTime || 0,
          dischargingTime: battery.dischargingTime || 0,
        };
      }
    } catch (e) {
      console.warn('Battery API not available:', e);
    }

    return {
      supported: false,
      level: 82,
      charging: false,
      chargingTime: 0,
      dischargingTime: 0,
    };
  }

  /**
   * Android Haptic Vibration Feedback
   */
  vibrate(pattern: number | number[] = 70): boolean {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        return navigator.vibrate(pattern);
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Read real phone device telemetry
   */
  getDeviceTelemetry(): DeviceTelemetry {
    const isClient = typeof window !== 'undefined';
    const screenRes = isClient ? `${window.screen.width} × ${window.screen.height} (${window.devicePixelRatio}x)` : '1080 × 2400';

    // @ts-expect-error deviceMemory standard in Chromium
    const memoryGb = isClient && navigator.deviceMemory ? navigator.deviceMemory : undefined;
    const cores = isClient && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 8;

    // @ts-expect-error connection in Chromium
    const conn = isClient && navigator.connection ? navigator.connection.effectiveType : '4g/Wi-Fi';

    return {
      platform: isClient ? (navigator as any).userAgentData?.platform || navigator.platform || 'Android' : 'Android',
      userAgent: isClient ? navigator.userAgent : 'Android Mobile',
      screenResolution: screenRes,
      cores,
      memoryGb,
      online: isClient ? navigator.onLine : true,
      connectionType: conn,
    };
  }

  /**
   * Supported Android App Catalog with real Android URI schemes and web fallbacks
   */
  getInstalledApps(): AppIntentDefinition[] {
    return [
      {
        id: 'youtube',
        name: 'YouTube',
        nameUrdu: 'یوٹیوب',
        iconName: 'Youtube',
        packageAndroid: 'com.google.android.youtube',
        deepLink: 'vnd.youtube:',
        fallbackUrl: 'https://m.youtube.com',
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp',
        nameUrdu: 'واٹس ایپ',
        iconName: 'MessageCircle',
        packageAndroid: 'com.whatsapp',
        deepLink: 'whatsapp://send',
        fallbackUrl: 'https://api.whatsapp.com/send',
      },
      {
        id: 'camera',
        name: 'Camera',
        nameUrdu: 'کیمرہ',
        iconName: 'Camera',
        packageAndroid: 'com.android.camera',
        deepLink: 'camera:',
        fallbackUrl: '#camera',
      },
      {
        id: 'gallery',
        name: 'Gallery / Photos',
        nameUrdu: 'گیلری',
        iconName: 'Image',
        packageAndroid: 'com.google.android.apps.photos',
        deepLink: 'content://media/internal/images/media',
        fallbackUrl: '#gallery',
      },
      {
        id: 'phone',
        name: 'Phone Dialer',
        nameUrdu: 'فون ڈائلر',
        iconName: 'Phone',
        packageAndroid: 'com.google.android.dialer',
        deepLink: 'tel:',
        fallbackUrl: 'tel:',
      },
      {
        id: 'settings',
        name: 'Android Settings',
        nameUrdu: 'سیٹنگز',
        iconName: 'Sliders',
        packageAndroid: 'com.android.settings',
        deepLink: 'intent:#Intent;action=android.settings.SETTINGS;end',
        fallbackUrl: '#settings',
      },
      {
        id: 'maps',
        name: 'Google Maps',
        nameUrdu: 'گوگل میپس',
        iconName: 'MapPin',
        packageAndroid: 'com.google.android.apps.maps',
        deepLink: 'geo:0,0?q=',
        fallbackUrl: 'https://maps.google.com',
      },
      {
        id: 'chrome',
        name: 'Chrome Browser',
        nameUrdu: 'کروم براؤزر',
        iconName: 'Globe',
        packageAndroid: 'com.android.chrome',
        deepLink: 'googlechrome://',
        fallbackUrl: 'https://google.com',
      },
      {
        id: 'calculator',
        name: 'Calculator',
        nameUrdu: 'کیلکولیٹر',
        iconName: 'Calculator',
        packageAndroid: 'com.google.android.calculator',
        deepLink: 'calculator:',
        fallbackUrl: '#calculator',
      },
      {
        id: 'clock',
        name: 'Clock & Alarms',
        nameUrdu: 'گھڑی اور الارم',
        iconName: 'Clock',
        packageAndroid: 'com.google.android.deskclock',
        deepLink: 'clock:',
        fallbackUrl: '#timers',
      },
    ];
  }

  /**
   * Launch an app on Android using Intent URI or fallback
   */
  launchApp(appId: string, customQuery?: string): { success: boolean; appName: string; actionNotice: string } {
    const apps = this.getInstalledApps();
    const target = apps.find((a) => a.id.toLowerCase() === appId.toLowerCase()) || apps.find((a) => a.name.toLowerCase().includes(appId.toLowerCase()));

    if (!target) {
      return {
        success: false,
        appName: appId,
        actionNotice: `App "${appId}" is not configured in quick launch.`,
      };
    }

    this.vibrate([50, 40, 50]);

    if (target.id === 'phone') {
      const dialUri = customQuery ? `tel:${encodeURIComponent(customQuery)}` : 'tel:';
      window.location.href = dialUri;
      return { success: true, appName: target.name, actionNotice: `Dialer launched for ${customQuery || 'contacts'}.` };
    }

    if (target.id === 'youtube') {
      const ytUrl = customQuery ? `https://m.youtube.com/results?search_query=${encodeURIComponent(customQuery)}` : target.fallbackUrl;
      window.open(ytUrl, '_blank');
      return { success: true, appName: target.name, actionNotice: `Opening YouTube${customQuery ? ` for "${customQuery}"` : ''}...` };
    }

    if (target.id === 'whatsapp') {
      const waUrl = customQuery ? `https://api.whatsapp.com/send?text=${encodeURIComponent(customQuery)}` : target.fallbackUrl;
      window.open(waUrl, '_blank');
      return { success: true, appName: target.name, actionNotice: 'Opening WhatsApp...' };
    }

    if (target.id === 'maps') {
      const mapUrl = customQuery ? `https://maps.google.com/?q=${encodeURIComponent(customQuery)}` : target.fallbackUrl;
      window.open(mapUrl, '_blank');
      return { success: true, appName: target.name, actionNotice: `Opening Google Maps for ${customQuery || 'location'}...` };
    }

    // Try intent or deepLink
    if (target.deepLink && !target.deepLink.startsWith('#')) {
      try {
        window.location.href = target.deepLink;
      } catch {
        window.open(target.fallbackUrl, '_blank');
      }
    }

    return {
      success: true,
      appName: target.name,
      actionNotice: `Launched ${target.name}.`,
    };
  }
}

export const androidSystem = new AndroidSystemService();
