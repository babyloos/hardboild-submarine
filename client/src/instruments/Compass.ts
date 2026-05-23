export class Compass {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private heading = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.draw();
  }

  setHeading(h: number): void {
    this.heading = ((h % 360) + 360) % 360;
    this.draw();
  }

  private draw(): void {
    const { ctx, canvas, heading } = this;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 6;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Outer ring
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Tick marks (every 10°)
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = ((deg - heading - 90) * Math.PI) / 180;
      const isMajor = deg % 30 === 0;
      const inner = isMajor ? r - 12 : r - 7;
      ctx.strokeStyle = isMajor ? "#444" : "#222";
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * inner, cy + Math.sin(rad) * inner);
      ctx.lineTo(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
      ctx.stroke();

      if (isMajor) {
        const labelR = r - 18;
        const label = deg === 0 ? "N" : deg === 90 ? "E" : deg === 180 ? "S" : deg === 270 ? "W" : `${deg}`;
        ctx.fillStyle = deg === 0 ? "#ff4444" : "#555";
        ctx.font = deg % 90 === 0 ? "bold 10px monospace" : "8px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, cx + Math.cos(rad) * labelR, cy + Math.sin(rad) * labelR);
      }
    }

    // Heading needle (always points up)
    ctx.strokeStyle = "#ff4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx, cy - r * 0.55);
    ctx.stroke();

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + r * 0.4);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Heading value
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`${String(Math.round(heading)).padStart(3, "0")}°`, cx, h - 4);

    ctx.fillStyle = "#555";
    ctx.font = "9px monospace";
    ctx.fillText("HDG", cx, h - 16);
  }
}
