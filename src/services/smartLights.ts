/**
 * Smart Lights Control Hub Service for Mirror AI
 * Supports visual simulated rooms, custom presets, scenes, and optional Home Assistant / Tuya Webhook integration.
 */

export interface SmartLightRoom {
  id: string;
  name: string;
  nameUrdu: string;
  isOn: boolean;
  brightness: number; // 0 - 100
  color: string; // hex
  icon: string;
}

export interface SmartHomeConfig {
  integrationType: 'simulator' | 'home_assistant' | 'tuya_webhook';
  homeAssistantUrl: string;
  homeAssistantToken: string;
  webhookUrl: string;
}

const STORAGE_LIGHTS_KEY = 'mirror_ai_smart_lights';
const STORAGE_CONFIG_KEY = 'mirror_ai_smarthome_config';

const INITIAL_ROOMS: SmartLightRoom[] = [
  {
    id: 'living_room',
    name: 'Living Room',
    nameUrdu: 'ڈرائنگ روم',
    isOn: true,
    brightness: 85,
    color: '#00f3ff',
    icon: 'Sofa',
  },
  {
    id: 'bedroom',
    name: 'Master Bedroom',
    nameUrdu: 'مین بیڈ روم',
    isOn: false,
    brightness: 40,
    color: '#a855f7',
    icon: 'BedDouble',
  },
  {
    id: 'studio',
    name: 'Cyber Studio',
    nameUrdu: 'سٹوڈیو',
    isOn: true,
    brightness: 100,
    color: '#3b82f6',
    icon: 'Cpu',
  },
  {
    id: 'desk',
    name: 'Desk Lamp',
    nameUrdu: 'ڈیسک لائٹ',
    isOn: true,
    brightness: 70,
    color: '#eab308',
    icon: 'Lamp',
  },
];

class SmartLightsService {
  private rooms: SmartLightRoom[] = [];
  private config: SmartHomeConfig = {
    integrationType: 'simulator',
    homeAssistantUrl: '',
    homeAssistantToken: '',
    webhookUrl: '',
  };

  constructor() {
    this.loadState();
  }

  private loadState() {
    if (typeof window === 'undefined') {
      this.rooms = INITIAL_ROOMS;
      return;
    }

    try {
      const savedRooms = localStorage.getItem(STORAGE_LIGHTS_KEY);
      this.rooms = savedRooms ? JSON.parse(savedRooms) : INITIAL_ROOMS;

      const savedConfig = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (savedConfig) {
        this.config = JSON.parse(savedConfig);
      }
    } catch {
      this.rooms = INITIAL_ROOMS;
    }
  }

  private saveState() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_LIGHTS_KEY, JSON.stringify(this.rooms));
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(this.config));
    } catch {}
  }

  getRooms(): SmartLightRoom[] {
    return [...this.rooms];
  }

  getConfig(): SmartHomeConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<SmartHomeConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
  }

  toggleRoom(roomId: string): SmartLightRoom | null {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return null;
    room.isOn = !room.isOn;
    this.saveState();
    this.dispatchHardwareSync(room);
    return { ...room };
  }

  setRoomState(roomId: string, updates: Partial<SmartLightRoom>): SmartLightRoom | null {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return null;
    Object.assign(room, updates);
    this.saveState();
    this.dispatchHardwareSync(room);
    return { ...room };
  }

  setAllLights(state: boolean): SmartLightRoom[] {
    this.rooms.forEach((r) => {
      r.isOn = state;
      this.dispatchHardwareSync(r);
    });
    this.saveState();
    return [...this.rooms];
  }

  applyScene(scene: 'movie' | 'focus' | 'cyberpunk' | 'night' | 'all_off') {
    switch (scene) {
      case 'movie':
        this.rooms.forEach((r) => {
          if (r.id === 'living_room') {
            r.isOn = true;
            r.brightness = 20;
            r.color = '#3b82f6';
          } else {
            r.isOn = false;
          }
        });
        break;
      case 'focus':
        this.rooms.forEach((r) => {
          r.isOn = true;
          r.brightness = 95;
          r.color = '#ffffff';
        });
        break;
      case 'cyberpunk':
        this.rooms.forEach((r) => {
          r.isOn = true;
          r.brightness = 100;
          r.color = r.id === 'studio' ? '#00f3ff' : '#ec4899';
        });
        break;
      case 'night':
        this.rooms.forEach((r) => {
          if (r.id === 'bedroom') {
            r.isOn = true;
            r.brightness = 15;
            r.color = '#f97316';
          } else {
            r.isOn = false;
          }
        });
        break;
      case 'all_off':
        this.rooms.forEach((r) => {
          r.isOn = false;
        });
        break;
    }
    this.saveState();
    return [...this.rooms];
  }

  /**
   * Send webhook or REST call if real Home Assistant or Tuya endpoint is configured
   */
  private async dispatchHardwareSync(room: SmartLightRoom) {
    if (this.config.integrationType === 'home_assistant' && this.config.homeAssistantUrl && this.config.homeAssistantToken) {
      try {
        const domain = 'light';
        const service = room.isOn ? 'turn_on' : 'turn_off';
        const url = `${this.config.homeAssistantUrl.replace(/\/+$/, '')}/api/services/${domain}/${service}`;
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.config.homeAssistantToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            entity_id: `light.${room.id}`,
            brightness_pct: room.brightness,
          }),
        });
      } catch (e) {
        console.warn('[SmartLights] Home Assistant dispatch failed:', e);
      }
    } else if (this.config.integrationType === 'tuya_webhook' && this.config.webhookUrl) {
      try {
        await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room: room.id,
            state: room.isOn ? 'ON' : 'OFF',
            brightness: room.brightness,
            color: room.color,
          }),
        });
      } catch (e) {
        console.warn('[SmartLights] Webhook dispatch failed:', e);
      }
    }
  }
}

export const smartLights = new SmartLightsService();
