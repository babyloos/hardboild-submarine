import { SonarContact, WeatherState } from "../../../shared/types";

/**
 * 潜望鏡ビュー — 2D俯瞰の計器的表示
 * 敵の方位・距離をレーダースコープ風に描画し、
 * 天気（霧・嵐）で視界にノイズを加える
 */
export class PeriscopeView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrame = 0;
  private scanLine = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.draw([], null, 0);
  }

  update(
    contacts: SonarContact[],
    weather: WeatherState | null,
    ownHeading: number,
    depth: number
  ): void {
    this.draw(contacts, weather, ownHeading, depth);
  }

  private draw(
    contacts: SonarContact[],
    weather: WeatherState | null,
    ownHeading: number,
    depth = 0
  ): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 6;

    ctx.clearRect(0, 0, w, h);

    // — Background (green phosphor CRT) —
    ctx.fillStyle = "#001400";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // — Scan lines (CRT effect) —
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, y, w, 1);
    }

    // — Concentric range rings —
    const ranges = [0.25, 0.5, 0.75, 1.0];
    ranges.forEach((ratio, i) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r * ratio, 0, Math.PI * 2);
      ctx.strokeStyle = i === ranges.length - 1 ? "#004400" : "#002800";
      ctx.lineWidth = i === ranges.length - 1 ? 2 : 1;
      ctx.stroke();
    });

    // — Range labels —
    ctx.fillStyle = "#003300";
    ctx.font = "8px monospace";
    ctx.textAlign = "left";
    ["250m", "500m", "750m", "1km"].forEach((label, i) => {
      ctx.fillText(label, cx + 4, cy - r * ranges[i] + 10);
    });

    // — Cardinal crosshairs —
    ctx.strokeStyle = "#002800";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.setLineDash([]);

    // — Heading tick (own ship direction) —
    const hdgRad = ((ownHeading - 90) * Math.PI) / 180;
    ctx.strokeStyle = "#00aa00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hdgRad) * r * 0.9, cy + Math.sin(hdgRad) * r * 0.9);
    ctx.stroke();

    // — Own ship symbol —
    ctx.fillStyle = "#00ff44";
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // — Weather visibility modifier —
    const visibilityRange = weather
      ? Math.min(1, weather.visibility / 5)  // 5km = full range
      : 1;
    const effectiveR = r * visibilityRange;

    // — Contacts —
    contacts.forEach((contact) => {
      const rad = ((contact.bearing - 90) * Math.PI) / 180;
      const dist = Math.min(contact.distance / 1000, 1) * effectiveR;
      const px = cx + Math.cos(rad) * dist;
      const py = cy + Math.sin(rad) * dist;

      // Blip glow
      const glow = ctx.createRadialGradient(px, py, 0, px, py, 8 + contact.strength * 6);
      glow.addColorStop(0, `rgba(0,255,80,${0.6 + contact.strength * 0.4})`);
      glow.addColorStop(1, "rgba(0,255,80,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 8 + contact.strength * 6, 0, Math.PI * 2);
      ctx.fill();

      // Solid blip
      ctx.fillStyle = "#00ff50";
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // — Weather overlay —
    if (weather) {
      // Fog effect
      if (weather.visibility < 2) {
        const fogAlpha = (2 - weather.visibility) / 2 * 0.5;
        const fog = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
        fog.addColorStop(0, "rgba(0,40,0,0)");
        fog.addColorStop(1, `rgba(0,10,0,${fogAlpha})`);
        ctx.fillStyle = fog;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Storm noise
      if (weather.waveHeight > 3) {
        const noiseCount = Math.floor((weather.waveHeight - 3) * 20);
        for (let i = 0; i < noiseCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist2 = Math.random() * r;
          const nx = cx + Math.cos(angle) * dist2;
          const ny = cy + Math.sin(angle) * dist2;
          ctx.fillStyle = `rgba(0,${80 + Math.random() * 100},0,${Math.random() * 0.4})`;
          ctx.beginPath();
          ctx.arc(nx, ny, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // — Vignette (circular mask) —
    const vignette = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = vignette;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // — Periscope crosshair overlay —
    ctx.strokeStyle = "rgba(0,200,0,0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    // Thin crosshairs
    ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12); ctx.stroke();

    // — Depth hidden overlay —
    if (depth <= 0) {
      ctx.fillStyle = "rgba(0,20,0,0.85)";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#003300";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("PERISCOPE RETRACTED", cx, cy - 8);
      ctx.font = "9px monospace";
      ctx.fillText("depth > 0m to deploy", cx, cy + 10);
    }

    // — Outer ring border —
    ctx.strokeStyle = "#004400";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // — Label —
    ctx.fillStyle = "#003300";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PERISCOPE", cx, h - 2);

    this.animFrame++;
  }
}
