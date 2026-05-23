import { SubmarineState, Vec2 } from "../../shared/types";
import {
  SUB_MAX_DEPTH, SUB_MAX_SPEED, SUB_TORPEDO_COUNT,
  SUB_OXYGEN_MAX, SUB_OXYGEN_DRAIN_RATE, TICK_INTERVAL_MS,
} from "../../shared/constants";

export class Submarine {
  state: SubmarineState;

  constructor(playerId: string, startPos: Vec2) {
    this.state = {
      id: `sub_${playerId}`,
      playerId,
      position: { ...startPos },
      heading: 0,
      speed: 0,
      enginePower: 0,
      depth: 0,
      targetDepth: 0,
      torpedoes: SUB_TORPEDO_COUNT,
      oxygen: SUB_OXYGEN_MAX,
      alive: true,
    };
  }

  setEngine(power: number): void {
    this.state.enginePower = Math.max(0, Math.min(100, power));
  }

  setRudder(angle: number): void {
    // heading changes at rate proportional to speed and rudder angle
    const turn = Math.max(-45, Math.min(45, angle));
    this.state.heading = (this.state.heading + turn * 0.05) % 360;
    if (this.state.heading < 0) this.state.heading += 360;
  }

  setDepth(depth: number): void {
    this.state.targetDepth = Math.max(0, Math.min(SUB_MAX_DEPTH, depth));
  }

  fireTorpedo(): { angle: number; pos: Vec2; heading: number } | null {
    if (this.state.torpedoes <= 0 || !this.state.alive) return null;
    this.state.torpedoes--;
    return { angle: this.state.heading, pos: { ...this.state.position }, heading: this.state.heading };
  }

  tick(dt: number, speedModifier: number): void {
    if (!this.state.alive) return;

    // Speed approaches target based on engine power
    const targetSpeed = (this.state.enginePower / 100) * SUB_MAX_SPEED * speedModifier;
    this.state.speed += (targetSpeed - this.state.speed) * 0.1;

    // Depth approaches target
    const depthDiff = this.state.targetDepth - this.state.depth;
    this.state.depth += depthDiff * 0.05;
    this.state.depth = Math.max(0, Math.min(SUB_MAX_DEPTH, this.state.depth));

    // Move forward
    const rad = (this.state.heading * Math.PI) / 180;
    const dist = (this.state.speed * dt) / 1000 * 0.5; // scaled for map units
    this.state.position.x += Math.sin(rad) * dist;
    this.state.position.y -= Math.cos(rad) * dist;

    // Oxygen drain when submerged
    if (this.state.depth > 0) {
      this.state.oxygen -= SUB_OXYGEN_DRAIN_RATE;
      if (this.state.oxygen <= 0) {
        this.state.oxygen = 0;
        this.state.alive = false;
      }
    } else {
      this.state.oxygen = Math.min(SUB_OXYGEN_MAX, this.state.oxygen + 0.05);
    }
  }

  takeDamage(): void {
    this.state.alive = false;
  }
}
