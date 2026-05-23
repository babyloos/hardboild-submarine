import { io } from "socket.io-client";
import { SERVER_EVENTS, CLIENT_EVENTS } from "../../shared/protocol";
import { SubmarineTick, DestroyerTick, Faction, WeatherState } from "../../shared/types";
import { EngineGauge }    from "./instruments/EngineGauge";
import { DepthGauge }     from "./instruments/DepthGauge";
import { SpeedGauge }     from "./instruments/SpeedGauge";
import { SonarDisplay }   from "./instruments/SonarDisplay";
import { ConvoyStatus }   from "./instruments/ConvoyStatus";
import { ActionLog }      from "./instruments/ActionLog";
import { PeriscopeView }  from "./instruments/PeriscopeView";
import { Compass }        from "./instruments/Compass";
import { AudioManager }   from "./audio/AudioManager";

// ── URL params ────────────────────────────────────────────────────────────
const params  = new URLSearchParams(window.location.search);
const faction = (params.get("faction") ?? "submarine") as Faction;
const roomId  = params.get("room") ?? "";

// ── Show correct panel ─────────────────────────────────────────────────────
document.getElementById(faction === "submarine" ? "sub-panel" : "dest-panel")!
  .classList.remove("hidden");

// ── Socket.io ──────────────────────────────────────────────────────────────
const socket = io();
socket.on("connect", () => {
  const name = sessionStorage.getItem("playerName") ?? "Sailor";
  socket.emit(CLIENT_EVENTS.JOIN_ROOM, { roomId, name, faction });
});

// ── Audio ──────────────────────────────────────────────────────────────────
const audio = new AudioManager();
let audioInitialized = false;
const initAudio = () => {
  if (!audioInitialized) { audio.init(); audioInitialized = true; }
};
document.addEventListener("click",     initAudio, { once: false });
document.addEventListener("touchstart", initAudio, { once: false });

let muted = false;
document.getElementById("mute-btn")?.addEventListener("click", () => {
  muted = !muted;
  audio.setEnabled(!muted);
  const btn = document.getElementById("mute-btn")!;
  btn.textContent = muted ? "🔇" : "🔊";
});

// ── Log ────────────────────────────────────────────────────────────────────
const log = new ActionLog(document.getElementById("action-log")!);

// ── State ──────────────────────────────────────────────────────────────────
let currentHeading = 0;
let currentDepth   = 0;
let currentWeather: WeatherState | null = null;

// ── Instruments ────────────────────────────────────────────────────────────
let engineGauge:   EngineGauge;
let speedGauge:    SpeedGauge;
let sonarDisplay:  SonarDisplay;
let compass:       Compass;
let depthGauge:    DepthGauge    | null = null;
let periscopeView: PeriscopeView | null = null;
let convoyStatus:  ConvoyStatus  | null = null;

const $ = (id: string) => document.getElementById(id) as HTMLCanvasElement;

if (faction === "submarine") {
  engineGauge = new EngineGauge($("sub-engine-canvas"), (p) => {
    socket.emit(CLIENT_EVENTS.SET_ENGINE, { power: p });
    audio.setEnginePower(p);
    log.add(`Engine → ${p}%`);
  });
  speedGauge    = new SpeedGauge($("sub-speed-canvas"), 20);
  depthGauge    = new DepthGauge($("sub-depth-canvas"), (d) => {
    socket.emit(CLIENT_EVENTS.SET_DEPTH, { depth: d });
    log.add(`Depth target → ${d}m`);
  });
  compass       = new Compass($("sub-compass-canvas"));
  sonarDisplay  = new SonarDisplay($("sub-sonar-canvas"));
  periscopeView = new PeriscopeView($("sub-periscope-canvas"));

  // Start sonar ping for submarines
  setTimeout(() => {
    if (audioInitialized) audio.startSonarPing(5000);
  }, 1000);

} else {
  engineGauge  = new EngineGauge($("dest-engine-canvas"), (p) => {
    socket.emit(CLIENT_EVENTS.SET_ENGINE, { power: p });
    audio.setEnginePower(p);
    log.add(`Engine → ${p}%`);
  });
  speedGauge   = new SpeedGauge($("dest-speed-canvas"), 30);
  compass      = new Compass($("dest-compass-canvas"));
  sonarDisplay = new SonarDisplay($("dest-sonar-canvas"));
  convoyStatus = new ConvoyStatus($("convoy-canvas"));
}

// ── Rudder ─────────────────────────────────────────────────────────────────
let rudderAngle = 0;
const leftId  = faction === "submarine" ? "sub-rudder-left"  : "dest-rudder-left";
const rightId = faction === "submarine" ? "sub-rudder-right" : "dest-rudder-right";

const setRudder = (angle: number) => {
  rudderAngle = angle;
  socket.emit(CLIENT_EVENTS.SET_RUDDER, { angle });
};

document.getElementById(leftId) ?.addEventListener("mousedown",  () => setRudder(-30));
document.getElementById(rightId)?.addEventListener("mousedown",  () => setRudder( 30));
document.getElementById(leftId) ?.addEventListener("touchstart", (e) => { e.preventDefault(); setRudder(-30); });
document.getElementById(rightId)?.addEventListener("touchstart", (e) => { e.preventDefault(); setRudder( 30); });
document.addEventListener("mouseup",  () => { if (rudderAngle !== 0) setRudder(0); });
document.addEventListener("touchend", () => { if (rudderAngle !== 0) setRudder(0); });

// ── Buttons ────────────────────────────────────────────────────────────────
document.getElementById("fire-torpedo")?.addEventListener("click", () => {
  socket.emit(CLIENT_EVENTS.FIRE_TORPEDO, {});
  audio.playTorpedoFire();
  log.add("🚀 Torpedo fired!");
});

document.getElementById("emergency-surface")?.addEventListener("click", () => {
  socket.emit(CLIENT_EVENTS.SET_DEPTH, { depth: 0 });
  log.add("⚠ Emergency surface!");
});

document.getElementById("drop-depth-charge")?.addEventListener("click", () => {
  socket.emit(CLIENT_EVENTS.DROP_DEPTH_CHARGE, {});
  audio.playExplosion("depth_charge");
  log.add("💣 Depth charge dropped!");
});

document.getElementById("start-btn")?.addEventListener("click", () => {
  socket.emit("client:start_game");
  log.add("— Mission started —");
});

// ── DOM helpers ────────────────────────────────────────────────────────────
const setText = (id: string, text: string) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};

const setWidth = (id: string, pct: number) => {
  const el = document.getElementById(id) as HTMLElement | null;
  if (!el) return;
  const clamped = Math.max(0, Math.min(100, pct));
  el.style.width = `${clamped}%`;
  el.classList.toggle("warning", clamped < 40 && clamped > 20);
  el.classList.toggle("danger",  clamped <= 20);
};

// ── Weather alert ─────────────────────────────────────────────────────────
let weatherAlertTimer: number | null = null;
const showWeatherAlert = (msg: string) => {
  const el = document.getElementById("weather-alert")!;
  el.textContent = `⚠ ${msg}`;
  el.classList.add("visible");
  if (weatherAlertTimer) clearTimeout(weatherAlertTimer);
  weatherAlertTimer = window.setTimeout(() => el.classList.remove("visible"), 4000);
};

const checkWeatherAlerts = (w: WeatherState, prev: WeatherState | null) => {
  if (!prev) return;
  if (prev.waveHeight <= 3 && w.waveHeight > 3) showWeatherAlert("HEAVY SEAS — Speed limited");
  if (prev.waveHeight <= 5 && w.waveHeight > 5) showWeatherAlert("STORM — Sonar range reduced");
  if (prev.visibility >= 2 && w.visibility < 2)  showWeatherAlert("FOG CLOSING IN");
};

// ── Tick handler ──────────────────────────────────────────────────────────
socket.on(SERVER_EVENTS.GAME_TICK, (data: SubmarineTick | DestroyerTick) => {
  const weather = (data as SubmarineTick).weather;
  const mission = (data as SubmarineTick).missionStatus;

  // HUD
  setText("weather-info",
    `${weather.description}  ≈ Wave ${weather.waveHeight.toFixed(1)}m  Wind ${weather.windSpeed.toFixed(0)}m/s`
  );
  setText("mission-status",
    `Convoy ${mission.convoyDelivered}/${mission.convoyTotal}  T+${mission.timeElapsed}s`
  );

  checkWeatherAlerts(weather, currentWeather);
  currentWeather = weather;

  if (faction === "submarine") {
    const tick = data as SubmarineTick;
    const sub  = tick.mySubmarine;

    currentHeading = sub.heading;
    currentDepth   = sub.depth;

    speedGauge.setSpeed(sub.speed);
    engineGauge.setValue(sub.enginePower);
    depthGauge?.setDepth(sub.depth);
    compass.setHeading(sub.heading);
    sonarDisplay.drawContacts(tick.sonarContacts);
    periscopeView?.update(tick.sonarContacts, weather, sub.heading, sub.depth);

    // Engine audio
    audio.setEnginePower(sub.enginePower);

    setText("sub-heading",   `${String(Math.round(sub.heading)).padStart(3,"0")}°`);
    setText("depth-display", `${Math.round(sub.depth)}m`);
    setText("coordinates",   sub.position
      ? `${sub.position.x.toFixed(0)},${sub.position.y.toFixed(0)}`
      : "CLASSIFIED"
    );
    setText("torpedo-count", String(sub.torpedoes));
    setWidth("oxygen", sub.oxygen);

  } else {
    const tick = data as DestroyerTick;
    const dest = tick.myDestroyer;

    currentHeading = dest.heading;

    speedGauge.setSpeed(dest.speed);
    engineGauge.setValue(dest.enginePower);
    compass.setHeading(dest.heading);
    sonarDisplay.drawSweep(tick.sonarDisplay);
    convoyStatus?.update(tick.convoyStatus);

    // Engine audio
    audio.setEnginePower(dest.enginePower);

    setText("dest-heading",       `${String(Math.round(dest.heading)).padStart(3,"0")}°`);
    setText("dest-speed-display", `${dest.speed.toFixed(1)}kt`);
    setText("dest-position",
      `${dest.position.x.toFixed(0)},${dest.position.y.toFixed(0)}`
    );
    setText("depth-charge-count", String(dest.depthCharges));
  }
});

// ── Events ────────────────────────────────────────────────────────────────
socket.on(SERVER_EVENTS.GAME_OVER, (data: { winner: string }) => {
  const overlay  = document.getElementById("game-over-overlay")!;
  const myWin =
    (faction === "destroyer" && data.winner === "allies") ||
    (faction === "submarine" && data.winner === "axis");

  overlay.classList.remove("hidden");
  overlay.classList.add(myWin ? "win" : "lose");
  setText("game-over-title",  myWin ? "🏆 VICTORY" : "💀 DEFEAT");
  setText("game-over-result",
    data.winner === "allies"
      ? "ALLIES VICTORY — Convoy delivered!"
      : "AXIS VICTORY — Convoy destroyed!"
  );
  log.add(myWin ? "🏆 Mission accomplished." : "💀 Mission failed.");
  audio.stopSonarPing();
});

socket.on(SERVER_EVENTS.EXPLOSION, (data: { type: string }) => {
  audio.playExplosion(data.type as "torpedo" | "depth_charge");
  log.add(data.type === "torpedo" ? "💥 Torpedo impact!" : "💥 Depth charge detonated!");
});

socket.on(SERVER_EVENTS.WEAPON_FIRED, (data: { type: string; ownerId: string }) => {
  if (data.ownerId !== socket.id) {
    if (data.type === "torpedo") {
      audio.playAlert();
      log.add("⚠ TORPEDO IN WATER!");
    } else {
      log.add("⚠ Depth charge dropped nearby.");
    }
  }
});

socket.on(SERVER_EVENTS.PLAYER_JOINED, (d: { name: string; faction: string }) => {
  log.add(`${d.name} joined — ${d.faction}`);
});

socket.on(SERVER_EVENTS.PLAYER_LEFT, () => {
  log.add("A player disconnected.");
});

socket.on(SERVER_EVENTS.WEATHER_UPDATE, (w: WeatherState) => {
  checkWeatherAlerts(w, currentWeather);
  currentWeather = w;
  log.add(`Weather: ${w.description}`);
});
