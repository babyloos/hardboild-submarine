export const TICK_INTERVAL_MS = 100;
export const WEATHER_POLL_INTERVAL_MS = 10 * 60 * 1000;

export const MAP_SIZE = 2000;         // game units (1 unit ≈ 100m)
export const MISSION_AREA_LAT = 50.0;
export const MISSION_AREA_LNG = -30.0;

// Submarine limits
export const SUB_MAX_DEPTH = 300;
export const SUB_MAX_SPEED = 20;      // knots
export const SUB_TORPEDO_COUNT = 12;
export const SUB_OXYGEN_MAX = 100;
export const SUB_OXYGEN_DRAIN_RATE = 0.01; // per tick at depth>0

// Destroyer limits
export const DEST_MAX_SPEED = 30;
export const DEST_DEPTH_CHARGE_COUNT = 20;
export const DEST_SONAR_RANGE = 800;

// Convoy
export const CONVOY_SPEED = 8;
export const CONVOY_HP = 100;

// Torpedo
export const TORPEDO_SPEED = 40;
export const TORPEDO_MAX_RANGE = 1000;
export const TORPEDO_HIT_RADIUS = 15;

// Position reveal conditions
export const SUB_COORD_REVEAL_MAX_DEPTH = 10;  // meters
export const SUB_COORD_REVEAL_MAX_SPEED = 5;   // knots

// Weather thresholds
export const WAVE_SPEED_PENALTY_THRESHOLD = 3;   // meters
export const WAVE_SONAR_PENALTY_THRESHOLD = 5;
export const WIND_PERISCOPE_THRESHOLD = 15;       // m/s
export const VISIBILITY_FOG_THRESHOLD = 1;        // km
