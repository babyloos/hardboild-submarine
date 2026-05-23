export class ActionLog {
  private entries: string[] = [];
  private el: HTMLElement;

  constructor(el: HTMLElement) {
    this.el = el;
  }

  add(msg: string): void {
    const time = new Date().toTimeString().slice(0, 8);
    this.entries.unshift(`[${time}] ${msg}`);
    if (this.entries.length > 50) this.entries.pop();
    this.render();
  }

  private render(): void {
    this.el.innerHTML = this.entries
      .slice(0, 10)
      .map((e) => `<div class="log-entry">${e}</div>`)
      .join("");
  }
}
