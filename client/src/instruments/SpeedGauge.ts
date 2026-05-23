export class SpeedGauge {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private speed = 0;
  private maxSpeed: number;

  constructor(canvas: HTMLCanvasElement, maxSpeed = 30) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.maxSpeed = maxSpeed;
    this.draw();
  }

  setSpeed(s: number): void {
    this.speed = s;
    this.draw();
  }

  private draw(): void {
    const { ctx, canvas, speed, maxSpeed } = this;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2 + 10;
    const r = Math.min(w, h) * 0.38;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Arc background
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25);
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Arc fill
    const pct = Math.min(speed / maxSpeed, 1);
    const startAngle = Math.PI * 0.75;
    const endAngle = startAngle + pct * Math.PI * 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = speed > maxSpeed * 0.8 ? "#ff4400" : "#00cc66";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Tick marks
    for (let i = 0; i <= 6; i++) {
      const angle = Math.PI * 0.75 + (i / 6) * Math.PI * 1.5;
      const inner = r - 12;
      const outer = r - 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Value
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.round(w * 0.2)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(speed.toFixed(1), cx, cy);

    ctx.fillStyle = "#aaa";
    ctx.font = "10px monospace";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("kt  SPEED", cx, h - 4);
  }
}
