import { DestroyerState, Vec2 } from "../../shared/types";
import { DEST_MAX_SPEED, DEST_DEPTH_CHARGE_COUNT } from "../../shared/constants";

export class Destroyer {
  state: DestroyerState;

  constructor(playerId: string, startPos: Vec2) {
    this.state = {
      id: `dest_${playerId}`,
      playerId,
      position: { ...startPos },
      heading: 0,
      speed: 0,
      enginePower: 0,
      depthCharges: DEST_DEPTH_CHARGE_COUNT,
      alive: true,
    };
  }

  setEngine(power: number): void {
    this.state.enginePower = Math.max(0, Math.min(100, power));
  }

  setRudder(angle: number): void {
    const turn = Math.max(-45, Math.min(45, angle));
    this.state.heading = (this.state.heading + turn * 0.05) % 360;
    if (this.state.heading < 0) this.state.heading += 360;
  }

  dropDepthCharge(): Vec2 | null {
    if (this.state.depthCharges <= 0 || !this.state.alive) return null;
    this.state.depthCharges--;
    return { ...this.state.position };
  }

  tick(dt: number, speedModifier: number): void {
    if (!this.state.alive) return;

    const targetSpeed = (this.state.enginePower / 100) * DEST_MAX_SPEED * speedModifier;
    this.state.speed += (targetSpeed - this.state.speed) * 0.1;

    const rad = (this.state.heading * Math.PI) / 180;
    const dist = (this.state.speed * dt) / 1000 * 0.5;
    this.state.position.x += Math.sin(rad) * dist;
    this.state.position.y -= Math.cos(rad) * dist;
  }
}
