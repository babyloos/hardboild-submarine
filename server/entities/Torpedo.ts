import { TorpedoState, Vec2 } from "../../shared/types";
import { TORPEDO_SPEED, TORPEDO_MAX_RANGE } from "../../shared/constants";

let torpedoCounter = 0;

export class Torpedo {
  state: TorpedoState;
  private distanceTraveled = 0;
  expired = false;

  constructor(ownerId: string, position: Vec2, heading: number) {
    this.state = {
      id: `torp_${++torpedoCounter}`,
      position: { ...position },
      heading,
      speed: TORPEDO_SPEED,
      ownerId,
    };
  }

  tick(dt: number): void {
    if (this.expired) return;

    const rad = (this.state.heading * Math.PI) / 180;
    const move = (this.state.speed * dt) / 1000 * 0.5;
    this.state.position.x += Math.sin(rad) * move;
    this.state.position.y -= Math.cos(rad) * move;
    this.distanceTraveled += move;

    if (this.distanceTraveled >= TORPEDO_MAX_RANGE) {
      this.expired = true;
    }
  }
}
