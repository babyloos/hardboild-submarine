import { io, Socket } from "socket.io-client";
import { CLIENT_EVENTS, SERVER_EVENTS } from "../../shared/protocol";
import { SubmarineTick, DestroyerTick, RoomInfo, Faction } from "../../shared/types";

type TickHandler = (data: SubmarineTick | DestroyerTick) => void;
type GameOverHandler = (data: { winner: string }) => void;
type RoomStateHandler = (data: { rooms: RoomInfo[] }) => void;
type JoinedHandler = (data: { roomId: string; faction: Faction }) => void;

export class GameClient {
  private socket: Socket;
  faction: Faction | null = null;
  roomId: string | null = null;

  onTick: TickHandler | null = null;
  onGameOver: GameOverHandler | null = null;
  onLobbyState: RoomStateHandler | null = null;
  onJoined: JoinedHandler | null = null;

  constructor() {
    this.socket = io();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.socket.on(SERVER_EVENTS.LOBBY_STATE, (data: { rooms: RoomInfo[] }) => {
      this.onLobbyState?.(data);
    });

    this.socket.on("joined", (data: { roomId: string; faction: Faction }) => {
      this.faction = data.faction;
      this.roomId = data.roomId;
      this.onJoined?.(data);
    });

    this.socket.on(SERVER_EVENTS.GAME_TICK, (data: SubmarineTick | DestroyerTick) => {
      this.onTick?.(data);
    });

    this.socket.on(SERVER_EVENTS.GAME_OVER, (data: { winner: string }) => {
      this.onGameOver?.(data);
    });
  }

  joinRoom(name: string, faction?: Faction): void {
    this.socket.emit(CLIENT_EVENTS.JOIN_ROOM, { name, faction });
  }

  startGame(): void {
    this.socket.emit("client:start_game");
  }

  setEngine(power: number): void {
    this.socket.emit(CLIENT_EVENTS.SET_ENGINE, { power });
  }

  setRudder(angle: number): void {
    this.socket.emit(CLIENT_EVENTS.SET_RUDDER, { angle });
  }

  setDepth(depth: number): void {
    this.socket.emit(CLIENT_EVENTS.SET_DEPTH, { depth });
  }

  fireTorpedo(): void {
    this.socket.emit(CLIENT_EVENTS.FIRE_TORPEDO, {});
  }

  dropDepthCharge(): void {
    this.socket.emit(CLIENT_EVENTS.DROP_DEPTH_CHARGE, {});
  }
}
