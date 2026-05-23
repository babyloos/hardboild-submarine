import { ConvoyShipState } from "../../../shared/types";

export class ConvoyStatus {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.draw([]);
  }

  update(convoys: ConvoyShipState[]): void {
    this.draw(convoys);
  }

  private draw(convoys: ConvoyShipState[]): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#555";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CONVOY STATUS", w / 2, 14);

    if (convoys.length === 0) {
      ctx.fillStyle = "#333";
      ctx.font = "9px monospace";
      ctx.fillText("Waiting for mission...", w / 2, h / 2);
      return;
    }

    const rowH = (h - 24) / Math.max(convoys.length, 1);

    convoys.forEach((c, i) => {
      const y = 22 + i * rowH;
      const hpPct = c.hp / c.maxHp;

      // Ship icon area
      ctx.fillStyle = c.alive ? "#888" : "#333";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`▸ C${i + 1}`, 8, y + rowH * 0.5);

      // HP bar background
      const barX = 40;
      const barW = w - barX - 8;
      const barHeight = 8;
      const barY = y + (rowH - barHeight) / 2;

      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(barX, barY, barW, barHeight);

      // HP bar fill
      const color = hpPct > 0.6 ? "#00cc66" : hpPct > 0.3 ? "#ffaa00" : "#cc0000";
      ctx.fillStyle = c.alive ? color : "#222";
      ctx.fillRect(barX, barY, barW * hpPct, barHeight);

      // Status label
      ctx.fillStyle = c.alive ? color : "#333";
      ctx.font = "8px monospace";
      ctx.textAlign = "right";
      const status = !c.alive ? "SUNK" : c.hp === c.maxHp ? "OK" : `${Math.round(hpPct * 100)}%`;
      ctx.fillText(status, w - 6, y + rowH * 0.5 + 3);
    });
  }
}
