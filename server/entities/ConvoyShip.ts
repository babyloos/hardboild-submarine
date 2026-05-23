import { ConvoyShipState, Vec2 } from "../../shared/types";
import { CONVOY_SPEED, CONVOY_HP } from "../../shared/constants";

export class ConvoyShip {
  state: ConvoyShipState;
  private goal: Vec2;
  private reachedGoal = false;

  constructor(id: string, startPos: Vec2, goal: Vec2) {
    this.state = {
      id,
      position: { ...startPos },
      heading: 0,
      speed: CONVOY_SPEED,
      hp: CONVOY_HP,
      maxHp: CONVOY_HP,
      alive: true,
    };
    this.goal = goal;
    this.updateHeading();
  }

  private updateHeading(): void {
    const dx = this.goal.x - this.state.position.x;
    const dy = this.goal.y - this.state.position.y;
    this.state.heading = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (this.state.heading < 0) this.state.heading += 360;
  }

  hasReachedGoal(): boolean {
    return this.reachedGoal;
  }

  tick(dt: number, speedModifier: number): void {
    if (!this.state.alive || this.reachedGoal) return;

    const dx = this.goal.x - this.state.position.x;
    const dy = this.goal.y - this.state.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
      this.reachedGoal = true;
      return;
    }

    const rad = (this.state.heading * Math.PI) / 180;
    const move = (this.state.speed * speedModifier * dt) / 1000 * 0.5;
    this.state.position.x += Math.sin(rad) * move;
    this.state.position.y -= Math.cos(rad) * move;
  }

  takeDamage(amount: number): void {
    this.state.hp -= amount;
    if (this.state.hp <= 0) {
      this.state.hp = 0;
      this.state.alive = false;
    }
  }
}
