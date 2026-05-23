/**
 * Web Audio API を使ったゲーム効果音マネージャ
 * 外部ファイル不要 — すべてプロシージャルに生成
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private sonarInterval: number | null = null;
  private enabled = true;

  /** ユーザーインタラクション後に初期化が必要 */
  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.setupEngine();
  }

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (this.engineGain) {
      this.engineGain.gain.value = v ? 0 : 0;
    }
  }

  // ── Engine hum ────────────────────────────────────────────────────────────
  private setupEngine(): void {
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 60;
    this.engineGain.gain.value = 0;

    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();
  }

  setEnginePower(power: number): void {
    if (!this.ctx || !this.engineGain || !this.engineOsc || !this.enabled) return;
    const freq = 40 + power * 1.2;
    const vol = (power / 100) * 0.04;
    this.engineOsc.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 0.5);
    this.engineGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.5);
  }

  // ── Sonar ping ────────────────────────────────────────────────────────────
  startSonarPing(intervalMs = 4000): void {
    if (this.sonarInterval !== null) return;
    this.sonarInterval = window.setInterval(() => this.playSonarPing(), intervalMs);
    this.playSonarPing();
  }

  stopSonarPing(): void {
    if (this.sonarInterval !== null) {
      clearInterval(this.sonarInterval);
      this.sonarInterval = null;
    }
  }

  private playSonarPing(): void {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  // ── Explosion ─────────────────────────────────────────────────────────────
  playExplosion(type: "torpedo" | "depth_charge" = "torpedo"): void {
    if (!this.ctx || !this.enabled) return;

    const duration = type === "torpedo" ? 1.2 : 0.8;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(type === "torpedo" ? 0.6 : 0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    // Low-pass filter for underwater boom
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = type === "torpedo" ? 400 : 250;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  // ── Alert beep (enemy torpedo detected) ──────────────────────────────────
  playAlert(): void {
    if (!this.ctx || !this.enabled) return;
    [0, 0.15, 0.3].forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + offset + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(this.ctx!.currentTime + offset);
      osc.stop(this.ctx!.currentTime + offset + 0.12);
    });
  }

  // ── Torpedo fire ──────────────────────────────────────────────────────────
  playTorpedoFire(): void {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  destroy(): void {
    this.stopSonarPing();
    this.engineOsc?.stop();
    this.ctx?.close();
  }
}
