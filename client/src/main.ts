import { io } from "socket.io-client";
import { SERVER_EVENTS, CLIENT_EVENTS } from "../../shared/protocol";
import { RoomInfo, Faction } from "../../shared/types";

const socket = io();

// DOM elements
const lobbyEl = document.getElementById("lobby")!;
const roomListEl = document.getElementById("room-list")!;
const nameInput = document.getElementById("player-name") as HTMLInputElement;
const factionSelect = document.getElementById("faction-select") as HTMLSelectElement;
const joinBtn = document.getElementById("join-btn")!;

joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "Sailor";
  const faction = factionSelect.value as Faction;
  socket.emit(CLIENT_EVENTS.JOIN_ROOM, { name, faction });
});

socket.on(SERVER_EVENTS.LOBBY_STATE, (data: { rooms: RoomInfo[] }) => {
  renderRooms(data.rooms);
});

socket.on("joined", (data: { roomId: string; faction: Faction }) => {
  // Redirect to game page with faction info
  window.location.href = `/game?faction=${data.faction}&room=${data.roomId}`;
});

function renderRooms(rooms: RoomInfo[]): void {
  if (rooms.length === 0) {
    roomListEl.innerHTML = "<p>No rooms yet. Be the first to join!</p>";
    return;
  }
  roomListEl.innerHTML = rooms
    .map(
      (r) =>
        `<div class="room-card">
          <strong>${r.name}</strong>
          <span>🚢 ${r.destroyers} / ⚓ ${r.submarines}</span>
          <span class="phase">${r.phase}</span>
        </div>`
    )
    .join("");
}
