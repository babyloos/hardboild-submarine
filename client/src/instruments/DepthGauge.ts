export class DepthGauge {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private depth = 0;
  private targetDepth = 0;
  private onChange: ((d: number) => void) | null = null;
  private dragging = false;

  constructor(canvas: HTMLCanvasElement, onChange?: (d: number) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.onChange = onChange ?? null;
    this.setupInput();
    this.draw();
  }

  setDepth(d: number): void {
    this.depth = d;
    this.draw();
  }

  setTarget(d: number): void {
    this.targetDepth = d;
    this.draw();
  }

  private setupInput(): void {
    const getY = (e: MouseEvent | TouchEvent): number => {
      const rect = this.canvas.getBoundingClientRect();
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return clientY - rect.top;
    };

    const updateFromY = (y: number): void => {
      const pct = y / this.canvas.height;
      const newDepth = Math.round(Math.max(0, Math.min(300, pct * 300)));
      this.targetDepth = newDepth;
      this.onChange?.(newDepth);
      this.draw();
    };

    this.canvas.addEventListener("mousedown", (e) => { this.dragging = true; updateFromY(getY(e)); });
    this.canvas.addEventListener("mousemove", (e) => { if (this.dragging) updateFromY(getY(e)); });
    window.addEventListener("mouseup", () => { this.dragging = false; });
    this.canvas.addEventListener("touchstart", (e) => { e.preventDefault(); updateFromY(getY(e)); });
    this.canvas.addEventListener("touchmove", (e) => { e.preventDefault(); updateFromY(getY(e)); });
  }

  private draw(): void {
    const { ctx, canvas, depth, targetDepth } = this;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Scale markings
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for (let d = 0; d <= 300; d += 50) {
      const y = (d / 300) * (h - 20) + 10;
      ctx.beginPath();
      ctx.moveTo(w * 0.6, y);
      ctx.lineTo(w * 0.75, y);
      ctx.stroke();
      ctx.fillStyle = "#555";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${d}m`, w * 0.58, y + 3);
    }

    // Target depth indicator
    const targetY = (targetDepth / 300) * (h - 20) + 10;
    ctx.strokeStyle = "#ffaa00";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.65, targetY);
    ctx.lineTo(w * 0.9, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current depth bar
    const currentY = (depth / 300) * (h - 20) + 10;
    ctx.fillStyle = depth > 250 ? "#ff0000" : depth > 150 ? "#ffaa00" : "#0088ff";
    ctx.fillRect(w * 0.75, 10, w * 0.15, currentY - 10);

    // Needle
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(w * 0.825, currentY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = "#aaa";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DEPTH", w / 2, h - 2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`${Math.round(depth)}m`, w / 2, 22);
  }
}
