export class EngineGauge {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private value = 0;
  private onChange: ((v: number) => void) | null = null;
  private dragging = false;

  constructor(canvas: HTMLCanvasElement, onChange?: (v: number) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.onChange = onChange ?? null;
    this.setupInput();
    this.draw();
  }

  setValue(v: number): void {
    this.value = Math.max(0, Math.min(100, v));
    this.draw();
  }

  private setupInput(): void {
    const getY = (e: MouseEvent | TouchEvent): number => {
      const rect = this.canvas.getBoundingClientRect();
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return clientY - rect.top;
    };

    const updateFromY = (y: number): void => {
      const pct = 1 - y / this.canvas.height;
      const newVal = Math.round(Math.max(0, Math.min(100, pct * 100)));
      this.setValue(newVal);
      this.onChange?.(newVal);
    };

    this.canvas.addEventListener("mousedown", (e) => { this.dragging = true; updateFromY(getY(e)); });
    this.canvas.addEventListener("mousemove", (e) => { if (this.dragging) updateFromY(getY(e)); });
    window.addEventListener("mouseup", () => { this.dragging = false; });
    this.canvas.addEventListener("touchstart", (e) => { e.preventDefault(); updateFromY(getY(e)); });
    this.canvas.addEventListener("touchmove", (e) => { e.preventDefault(); updateFromY(getY(e)); });
  }

  private draw(): void {
    const { ctx, canvas, value } = this;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    // Track
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.3, 8, w * 0.4, h - 16);

    // Fill bar
    const fillH = ((h - 16) * value) / 100;
    ctx.fillStyle = value > 70 ? "#ff4400" : value > 40 ? "#ffaa00" : "#00cc66";
    ctx.fillRect(w * 0.3 + 1, h - 8 - fillH, w * 0.4 - 2, fillH);

    // Label
    ctx.fillStyle = "#aaa";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("ENGINE", w / 2, h - 2);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`${value}%`, w / 2, 20);
  }
}
