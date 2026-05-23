import { Server } from "socket.io";
import { BalanceManager } from "./BalanceManager";
import { GameLoop } from "./GameLoop";
import { MissionManager } from "./MissionManager";
import { WeatherService } from "../weather/WeatherService";
import { RoomInfo, Faction, GamePhase, PlayerInfo } from "../../shared/types";
import { SERVER_EVENTS } from "../../shared/protocol";

export class GameRoom {
  private balance = new BalanceManager();
  private mission = new MissionManager();
  private loop: GameLoop;
  private players = new Map<string, PlayerInfo>();
  phase: GamePhase = "waiting";

  constructor(
    public readonly id: string,
    public readonly name: string,
    private readonly io: Server,
    private readonly weather: WeatherService
  ) {
    this.loop = new GameLoop(id, io, this.balance, this.mission, weather);
  }

  addPlayer(socketId: string, playerName: string, preferred?: Faction): Faction {
    const faction = this.balance.assign(socketId, preferred);
    this.players.set(socketId, { id: socketId, name: playerName, faction });

    if (faction === "submarine") {
      this.loop.addSubmarine(socketId);
    } else {
      this.loop.addDestroyer(socketId);
    }

    this.io.to(this.id).emit(SERVER_EVENTS.PLAYER_JOINED, { id: socketId, name: playerName, faction });
    this.broadcastRoomState();
    return faction;
  }

  removePlayer(socketId: string): void {
    this.balance.remove(socketId);
    this.loop.removePlayer(socketId);
    this.players.delete(socketId);
    this.io.to(this.id).emit(SERVER_EVENTS.PLAYER_LEFT, { id: socketId });
    this.broadcastRoomState();
  }

  startGame(): void {
    if (this.phase !== "waiting") return;
    this.phase = "playing";
    this.loop.start();
  }

  handlePlayerCommand(socketId: string, event: string, data: unknown): void {
    const d = data as Record<string, number>;
    switch (event) {
      case "client:set_engine":
        this.loop.handleSetEngine(socketId, d.power);
        break;
      case "client:set_rudder":
        this.loop.handleSetRudder(socketId, d.angle);
        break;
      case "client:set_depth":
        this.loop.handleSetDepth(socketId, d.depth);
        break;
      case "client:fire_torpedo":
        this.loop.handleFireTorpedo(socketId);
        break;
      case "client:drop_depth_charge":
        this.loop.handleDropDepthCharge(socketId);
        break;
    }
  }

  getInfo(): RoomInfo {
    return {
      id: this.id,
      name: this.name,
      submarines: this.balance.submarineCount(),
      destroyers: this.balance.destroyerCount(),
      phase: this.phase,
    };
  }

  playerCount(): number {
    return this.players.size;
  }

  private broadcastRoomState(): void {
    this.io.to(this.id).emit(SERVER_EVENTS.ROOM_STATE, {
      room: this.getInfo(),
      players: Array.from(this.players.values()),
    });
  }
}
