export type Faction = "submarine" | "destroyer";
export type GamePhase = "waiting" | "playing" | "finished";

export interface Vec2 {
  x: number;
  y: number;
}

export interface SubmarineState {
  id: string;
  playerId: string;
  position: Vec2;
  heading: number;       // degrees 0-359
  speed: number;         // knots
  enginePower: number;   // 0-100
  depth: number;         // meters 0-300
  targetDepth: number;
  torpedoes: number;
  oxygen: number;        // 0-100
  alive: boolean;
}

export interface DestroyerState {
  id: string;
  playerId: string;
  position: Vec2;
  heading: number;
  speed: number;
  enginePower: number;
  depthCharges: number;
  alive: boolean;
}

export interface ConvoyShipState {
  id: string;
  position: Vec2;
  heading: number;
  speed: number;
  hp: number;
  maxHp: number;
  alive: boolean;
}

export interface TorpedoState {
  id: string;
  position: Vec2;
  heading: number;
  speed: number;
  ownerId: string;
}

export interface SonarContact {
  bearing: number;       // degrees from own heading
  distance: number;      // rough estimate (not exact)
  strength: number;      // 0-1 signal intensity
}

export interface SonarSweep {
  contacts: Array<{ angle: number; distance: number; intensity: number }>;
  range: number;
}

export interface MissionStatus {
  phase: GamePhase;
  convoyDelivered: number;
  convoyTotal: number;
  timeElapsed: number;   // seconds
}

export interface WeatherState {
  waveHeight: number;    // meters
  windSpeed: number;     // m/s
  visibility: number;    // km
  description: string;
}

// Tick payloads sent per faction
export interface SubmarineTick {
  tick: number;
  mySubmarine: Pick<SubmarineState, "enginePower" | "speed" | "depth" | "heading" | "torpedoes" | "oxygen"> & {
    position?: Vec2;   // only revealed at depth<10m && speed<5
  };
  sonarContacts: SonarContact[];
  weather: WeatherState;
  missionStatus: MissionStatus;
}

export interface DestroyerTick {
  tick: number;
  myDestroyer: Pick<DestroyerState, "enginePower" | "speed" | "heading" | "depthCharges" | "position">;
  sonarDisplay: SonarSweep;
  convoyStatus: ConvoyShipState[];
  weather: WeatherState;
  missionStatus: MissionStatus;
}

export interface RoomInfo {
  id: string;
  name: string;
  submarines: number;
  destroyers: number;
  phase: GamePhase;
}

export interface PlayerInfo {
  id: string;
  name: string;
  faction: Faction;
}
