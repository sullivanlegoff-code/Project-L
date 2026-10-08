export interface Preferences {muted: boolean; tutorial: boolean; intro: boolean; tutorialDone: boolean}
export class PreferenceStore {
  value: Preferences = {muted: false, tutorial: true, intro: false, tutorialDone: false};
  constructor(private key: string) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
      for (const field of Object.keys(this.value) as (keyof Preferences)[]) if (typeof raw[field] === 'boolean') this.value[field] = raw[field];
    } catch { /* Optional preferences stay usable in memory. */ }
  }
  set(patch: Partial<Preferences>): void { Object.assign(this.value, patch); try { localStorage.setItem(this.key, JSON.stringify(this.value)); } catch { /* in-memory preference */ } }
}
export class Sounds {
  private context: AudioContext | null = null;
  constructor(private preferences: PreferenceStore) {}
  ping(): void {
    if (this.preferences.value.muted) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
      const oscillator = this.context.createOscillator(), gain = this.context.createGain(), time = this.context.currentTime;
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(660, time); oscillator.frequency.exponentialRampToValueAtTime(880, time + .12);
      gain.gain.setValueAtTime(.035, time); gain.gain.exponentialRampToValueAtTime(.001, time + .18);
      oscillator.connect(gain).connect(this.context.destination); oscillator.start(); oscillator.stop(time + .2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Sound is optional. */ }
  }
  dispose(): void { if (this.context) void this.context.close().catch(() => {}); }
}
