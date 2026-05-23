import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { GameRoom } from "./game/GameRoom";
import { WeatherService } from "./weather/WeatherService";
import { CLIENT_EVENTS, SERVER_EVENTS } from "../shared/protocol";
import { Faction } from "../shared/types";
import { shopRouter } from "./routes/shop";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

// Body parser for API routes
app.use(express.json());

// API routes
app.use("/api/shop", shopRouter);

// Static files
app.use(express.static(path.join(__dirname, "../client")));
app.get("/game", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/game.html"));
});
app.get("/shop", (_req, res) => {
  res.sendFile(path.join(__dirname, "../client/shop.html"));
});
app.get("/shop/success", (req, res) => {
  const skin = req.query.skin ?? "default";
  res.send(`
    <html><head><meta charset="UTF-8">
    <script>
      localStorage.setItem('skin', '${skin}');
      localStorage.setItem('pendingSkin', '${skin}');
      window.location.href = '/shop';
    </script></head></html>
  `);
});

const weather = new WeatherService();
weather.start();

const rooms = new Map<string, GameRoom>();

function getOrCreateRoom(name = "Default Room"): GameRoom {
  for (const room of rooms.values()) {
    if (room.phase === "waiting" && room.playerCount() < 8) return room;
  }
  const id = `room_${Date.now()}`;
  const room = new GameRoom(id, name, io, weather);
  rooms.set(id, room);
  return room;
}

io.on("connection", (socket) => {
  let currentRoom: GameRoom | null = null;

  // Send lobby state on connect
  socket.emit(SERVER_EVENTS.LOBBY_STATE, {
    rooms: Array.from(rooms.values()).map((r) => r.getInfo()),
  });

  socket.on(CLIENT_EVENTS.JOIN_ROOM, (data: { roomId?: string; name?: string; faction?: Faction }) => {
    const room = data.roomId ? rooms.get(data.roomId) ?? getOrCreateRoom() : getOrCreateRoom();

    socket.join(room.id);
    currentRoom = room;

    const faction = room.addPlayer(socket.id, data.name ?? "Unknown", data.faction);
    socket.emit("joined", { roomId: room.id, faction });
  });

  socket.on(CLIENT_EVENTS.CREATE_ROOM, (data: { name?: string; faction?: Faction }) => {
    const room = getOrCreateRoom(data.name ?? "Room");
    socket.join(room.id);
    currentRoom = room;
    const faction = room.addPlayer(socket.id, "Host", data.faction);
    socket.emit("joined", { roomId: room.id, faction });
  });

  // Forward all game commands to room
  const gameEvents = [
    CLIENT_EVENTS.SET_ENGINE,
    CLIENT_EVENTS.SET_RUDDER,
    CLIENT_EVENTS.SET_DEPTH,
    CLIENT_EVENTS.FIRE_TORPEDO,
    CLIENT_EVENTS.DROP_DEPTH_CHARGE,
    CLIENT_EVENTS.USE_PERISCOPE,
  ];

  for (const event of gameEvents) {
    socket.on(event, (data: unknown) => {
      currentRoom?.handlePlayerCommand(socket.id, event, data);
    });
  }

  // Start game when requested (first player can trigger)
  socket.on("client:start_game", () => {
    currentRoom?.startGame();
  });

  socket.on("disconnect", () => {
    if (currentRoom) {
      socket.leave(currentRoom.id);
      currentRoom.removePlayer(socket.id);
      if (currentRoom.playerCount() === 0) {
        rooms.delete(currentRoom.id);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Hardboild Submarine server running on http://localhost:${PORT}`);
});
