export const CLIENT_EVENTS = {
  JOIN_LOBBY: "client:join_lobby",
  CREATE_ROOM: "client:create_room",
  JOIN_ROOM: "client:join_room",
  SET_ENGINE: "client:set_engine",
  SET_RUDDER: "client:set_rudder",
  SET_DEPTH: "client:set_depth",
  FIRE_TORPEDO: "client:fire_torpedo",
  DROP_DEPTH_CHARGE: "client:drop_depth_charge",
  USE_PERISCOPE: "client:use_periscope",
} as const;

export const SERVER_EVENTS = {
  LOBBY_STATE: "server:lobby_state",
  ROOM_STATE: "server:room_state",
  GAME_TICK: "server:game_tick",
  WEAPON_FIRED: "server:weapon_fired",
  EXPLOSION: "server:explosion",
  MISSION_UPDATE: "server:mission_update",
  WEATHER_UPDATE: "server:weather_update",
  GAME_OVER: "server:game_over",
  PLAYER_JOINED: "server:player_joined",
  PLAYER_LEFT: "server:player_left",
  ERROR: "server:error",
} as const;
