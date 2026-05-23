import { Server, Socket } from "socket.io";
import { Submarine } from "../entities/Submarine";
import { Destroyer } from "../entities/Destroyer";
import { Torpedo } from "../entities/Torpedo";
import { MissionManager } from "./MissionManager";
import { WeatherService } from "../weather/WeatherService";
import { BalanceManager } from "./BalanceManager";
import {
  buildSubmarineSonarContacts,
  buildDestroyerSonarSweep,
} from "../physics/SonarPhysics";
import { getSpeedModifier, getSonarRangeModifier, distance } from "../physics/OceanPhysics";
import { SERVER_EVENTS } from "../../shared/protocol";
import {
  SubmarineTick, DestroyerTick, Vec2,
} from "../../shared/types";
import {
  TICK_INTERVAL_MS, MAP_SIZE,
  TORPEDO_HIT_RADIUS, SUB_COORD_REVEAL_MAX_DEPTH, SUB_COORD_REVEAL_MAX_SPEED,
} from "../../shared/constants";

export class GameLoop {
  private submarines = new Map<string, Submarine>();
  private destroyers = new Map<string, Destroyer>();
  private torpedoes: Torpedo[] = [];
  private depthChargePositions: Vec2[] = [];

  private tickCount = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly roomId: string,
    private readonly io: Server,
    private readonly balance: BalanceManager,
    private readonly mission: MissionManager,
    private readonly weather: WeatherService
  ) {}

  addSubmarine(playerId: string): void {
    const pos: Vec2 = { x: MAP_SIZE * 0.15, y: MAP_SIZE * 0.5 + Math.random() * 100 - 50 };
    this.submarines.set(playerId, new Submarine(playerId, pos));
  }

  addDestroyer(playerId: string): void {
    const pos: Vec2 = { x: MAP_SIZE * 0.85, y: MAP_SIZE * 0.5 + Math.random() * 100 - 50 };
    this.destroyers.set(playerId, new Destroyer(playerId, pos));
  }

  removePlayer(playerId: string): void {
    this.submarines.delete(playerId);
    this.destroyers.delete(playerId);
  }

  handleSetEngine(playerId: string, power: number): void {
    this.submarines.get(playerId)?.setEngine(power);
    this.destroyers.get(playerId)?.setEngine(power);
  }

  handleSetRudder(playerId: string, angle: number): void {
    this.submarines.get(playerId)?.setRudder(angle);
    this.destroyers.get(playerId)?.setRudder(angle);
  }

  handleSetDepth(playerId: string, depth: number): void {
    this.submarines.get(playerId)?.setDepth(depth);
  }

  handleFireTorpedo(playerId: string): void {
    const sub = this.submarines.get(playerId);
    if (!sub) return;
    const result = sub.fireTorpedo();
    if (result) {
      this.torpedoes.push(new Torpedo(playerId, result.pos, result.heading));
      this.io.to(this.roomId).emit(SERVER_EVENTS.WEAPON_FIRED, {
        type: "torpedo",
        ownerId: playerId,
      });
    }
  }

  handleDropDepthCharge(playerId: string): void {
    const dest = this.destroyers.get(playerId);
    if (!dest) return;
    const pos = dest.dropDepthCharge();
    if (pos) {
      this.depthChargePositions.push(pos);
      this.io.to(this.roomId).emit(SERVER_EVENTS.WEAPON_FIRED, {
        type: "depth_charge",
        ownerId: playerId,
      });
    }
  }

  start(): void {
    this.mission.start();
    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private tick(): void {
    const dt = TICK_INTERVAL_MS;
    const weatherState = this.weather.get();
    const speedMod = getSpeedModifier(weatherState);
    const sonarMod = getSonarRangeModifier(weatherState);

    // Update entities
    for (const sub of this.submarines.values()) sub.tick(dt, speedMod);
    for (const dest of this.destroyers.values()) dest.tick(dt, speedMod);
    for (const torp of this.torpedoes) torp.tick(dt);
    this.mission.tick(dt, speedMod);

    // Torpedo hit detection
    this.torpedoes = this.torpedoes.filter((torp) => {
      if (torp.expired) return false;

      for (const convoy of this.mission.convoys) {
        if (!convoy.state.alive) continue;
        if (distance(torp.state.position, convoy.state.position) < TORPEDO_HIT_RADIUS) {
          convoy.takeDamage(50);
          this.io.to(this.roomId).emit(SERVER_EVENTS.EXPLOSION, { pos: torp.state.position, type: "torpedo" });
          return false;
        }
      }

      for (const dest of this.destroyers.values()) {
        if (!dest.state.alive) continue;
        if (distance(torp.state.position, dest.state.position) < TORPEDO_HIT_RADIUS) {
          dest.state.alive = false;
          this.io.to(this.roomId).emit(SERVER_EVENTS.EXPLOSION, { pos: torp.state.position, type: "torpedo" });
          return false;
        }
      }

      return true;
    });

    // Depth charge hit detection
    this.depthChargePositions = this.depthChargePositions.filter((dcPos) => {
      for (const sub of this.submarines.values()) {
        if (!sub.state.alive) continue;
        if (distance(dcPos, sub.state.position) < TORPEDO_HIT_RADIUS * 2) {
          sub.takeDamage();
          this.io.to(this.roomId).emit(SERVER_EVENTS.EXPLOSION, { pos: dcPos, type: "depth_charge" });
          return false;
        }
      }
      return false; // depth charges detonate after one tick
    });

    // Check game over
    const winner = this.mission.checkWinner();
    if (winner) {
      this.stop();
      this.mission.phase = "finished";
      this.io.to(this.roomId).emit(SERVER_EVENTS.GAME_OVER, { winner });
      return;
    }

    // Broadcast per-faction ticks
    this.tickCount++;
    const missionStatus = this.mission.getStatus();
    const convoyStatus = this.mission.convoys.map((c) => c.state);

    for (const [playerId, sub] of this.submarines) {
      const { enginePower, speed, depth, heading, torpedoes, oxygen, position } = sub.state;

      const revealPosition =
        depth < SUB_COORD_REVEAL_MAX_DEPTH && speed < SUB_COORD_REVEAL_MAX_SPEED;

      const allTargets = [
        ...Array.from(this.destroyers.values()).map((d) => ({ position: d.state.position, depth: 0 })),
        ...convoyStatus.map((c) => ({ position: c.position, depth: 0 })),
      ];

      const payload: SubmarineTick = {
        tick: this.tickCount,
        mySubmarine: {
          enginePower, speed, depth, heading, torpedoes, oxygen,
          ...(revealPosition ? { position } : {}),
        },
        sonarContacts: buildSubmarineSonarContacts(position, heading, depth, allTargets, sonarMod),
        weather: weatherState,
        missionStatus,
      };

      this.io.to(playerId).emit(SERVER_EVENTS.GAME_TICK, payload);
    }

    for (const [playerId, dest] of this.destroyers) {
      const { enginePower, speed, heading, depthCharges, position } = dest.state;

      const subTargets = Array.from(this.submarines.values()).map((s) => ({
        position: s.state.position,
        depth: s.state.depth,
      }));

      const payload: DestroyerTick = {
        tick: this.tickCount,
        myDestroyer: { enginePower, speed, heading, depthCharges, position },
        sonarDisplay: buildDestroyerSonarSweep(position, subTargets, sonarMod),
        convoyStatus,
        weather: weatherState,
        missionStatus,
      };

      this.io.to(playerId).emit(SERVER_EVENTS.GAME_TICK, payload);
    }
  }
}
