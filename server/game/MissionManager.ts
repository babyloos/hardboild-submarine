import { ConvoyShip } from "../entities/ConvoyShip";
import { MissionStatus, Vec2, GamePhase } from "../../shared/types";
import { MAP_SIZE } from "../../shared/constants";

export interface MissionConfig {
  convoyCount: number;
  startPos: Vec2;
  goalPos: Vec2;
}

const MISSIONS: MissionConfig[] = [
  {
    convoyCount: 3,
    startPos: { x: MAP_SIZE * 0.1, y: MAP_SIZE * 0.5 },
    goalPos: { x: MAP_SIZE * 0.9, y: MAP_SIZE * 0.5 },
  },
  {
    convoyCount: 4,
    startPos: { x: MAP_SIZE * 0.1, y: MAP_SIZE * 0.2 },
    goalPos: { x: MAP_SIZE * 0.9, y: MAP_SIZE * 0.8 },
  },
];

export class MissionManager {
  convoys: ConvoyShip[] = [];
  private config: MissionConfig;
  private timeElapsed = 0;
  phase: GamePhase = "waiting";

  constructor(missionIndex = 0) {
    this.config = MISSIONS[missionIndex % MISSIONS.length];
  }

  start(): void {
    this.phase = "playing";
    for (let i = 0; i < this.config.convoyCount; i++) {
      // Stagger convoy positions slightly
      const offset = i * 30;
      const start: Vec2 = {
        x: this.config.startPos.x,
        y: this.config.startPos.y + offset,
      };
      this.convoys.push(new ConvoyShip(`convoy_${i}`, start, this.config.goalPos));
    }
  }

  tick(dt: number, speedModifier: number): void {
    if (this.phase !== "playing") return;
    this.timeElapsed += dt / 1000;
    for (const convoy of this.convoys) {
      convoy.tick(dt, speedModifier);
    }
  }

  checkWinner(): "allies" | "axis" | null {
    const alive = this.convoys.filter((c) => c.state.alive);
    const delivered = this.convoys.filter((c) => c.hasReachedGoal()).length;

    // Allies win if majority delivered
    if (delivered >= Math.ceil(this.config.convoyCount / 2)) return "allies";
    // Axis wins if all remaining convoys are sunk
    if (alive.length === 0 && delivered < Math.ceil(this.config.convoyCount / 2)) return "axis";
    return null;
  }

  getStatus(): MissionStatus {
    const delivered = this.convoys.filter((c) => c.hasReachedGoal()).length;
    return {
      phase: this.phase,
      convoyDelivered: delivered,
      convoyTotal: this.config.convoyCount,
      timeElapsed: Math.floor(this.timeElapsed),
    };
  }
}
