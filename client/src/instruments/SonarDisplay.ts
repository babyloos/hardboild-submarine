import { SonarContact, SonarSweep } from "../../../shared/types";

export class SonarDisplay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sweepAngle = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.draw([]);
  }

  // For submarine sonar contacts
  drawContacts(contacts: SonarContact[]): void {
    this.sweepAngle = (this.sweepAngle + 3) % 360;
    this.draw(contacts);
  }

  // For destroyer sonar sweep
  drawSweep(sweep: SonarSweep): void {
    this.sweepAngle = (this.sweepAngle + 3) % 360;
    this.drawDestroyerSonar(sweep);
  }

  private draw(contacts: SonarContact[]): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 8;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#001a00";
    ctx.fillRect(0, 0, w, h);

    // Concentric rings
    ctx.strokeStyle = "#002200";
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r * i) / 4, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Cross lines
    ctx.strokeStyle = "#002200";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

    // Sweep line
    const sweepRad = (this.sweepAngle * Math.PI) / 180;
    const grad = ctx.createLinearGradient(cx, cy, cx + Math.cos(sweepRad) * r, cy + Math.sin(sweepRad) * r);
    grad.addColorStop(0, "rgba(0,255,0,0.4)");
    grad.addColorStop(1, "rgba(0,255,0,0)");
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepRad) * r, cy + Math.sin(sweepRad) * r);
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Contacts
    for (const contact of contacts) {
      const rad = ((contact.bearing - 90) * Math.PI) / 180;
      const dist = (contact.distance / 800) * r;
      const cx2 = cx + Math.cos(rad) * dist;
      const cy2 = cy + Math.sin(rad) * dist;
      ctx.beginPath();
      ctx.arc(cx2, cy2, 4 + contact.strength * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,0,${0.4 + contact.strength * 0.6})`;
      ctx.fill();
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff00";
    ctx.fill();

    // Label
    ctx.fillStyle = "#00aa00";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SONAR", cx, h - 2);
  }

  private drawDestroyerSonar(sweep: SonarSweep): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 8;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#001a00";
    ctx.fillRect(0, 0, w, h);

    // Rings and lines (same as above)
    ctx.strokeStyle = "#002200";
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (r * i) / 4, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Sweep
    const sweepRad = (this.sweepAngle * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepRad) * r, cy + Math.sin(sweepRad) * r);
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Contacts
    for (const c of sweep.contacts) {
      const rad = ((c.angle - 90) * Math.PI) / 180;
      const dist = (c.distance / sweep.range) * r;
      const cx2 = cx + Math.cos(rad) * dist;
      const cy2 = cy + Math.sin(rad) * dist;
      ctx.beginPath();
      ctx.arc(cx2, cy2, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,128,${0.3 + c.intensity * 0.7})`;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff00";
    ctx.fill();

    ctx.fillStyle = "#00aa00";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SONAR", cx, h - 2);
  }
}
