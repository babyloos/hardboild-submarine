import { SKINS, getSkin, applySkin, loadSkin, saveSkin } from "../../shared/skins";

// Load saved skin on page load
loadSkin();

const playerId = localStorage.getItem("playerId") ?? (() => {
  const id = `player_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem("playerId", id);
  return id;
})();

document.getElementById("player-label")!.textContent = `ID: ${playerId}`;

const grid = document.getElementById("skin-grid")!;
const activeSkinId = localStorage.getItem("skin") ?? "default";

// Fetch owned skins
fetch(`/api/shop/owned/${playerId}`)
  .then((r) => r.json())
  .then((data: { owned: string[] }) => renderSkins(data.owned))
  .catch(() => renderSkins(["default"]));

function renderSkins(owned: string[]): void {
  grid.innerHTML = "";

  SKINS.forEach((skin) => {
    const isOwned  = owned.includes(skin.id) || skin.price === 0;
    const isActive = skin.id === activeSkinId;

    const card = document.createElement("div");
    card.className = `skin-card${isActive ? " active" : ""}${isOwned ? " owned" : ""}`;

    // Preview colors
    const preview = document.createElement("div");
    preview.className = "skin-preview";
    preview.style.background = `linear-gradient(135deg, ${skin.vars.bgPanel} 0%, ${skin.vars.bgInset} 50%, ${skin.vars.bgDeep} 100%)`;
    preview.style.border = `1px solid ${skin.vars.border}`;

    // Green bar accent
    const accent = document.createElement("div");
    accent.style.cssText = `
      position:absolute; bottom:6px; left:10px; right:10px;
      height:4px; background:${skin.vars.green}; opacity:0.7;
      border-radius:2px;
    `;
    preview.appendChild(accent);

    const badge = skin.price === 0 ? "FREE"
      : isOwned ? "OWNED"
      : `¥${skin.price}`;

    card.innerHTML += `
      <div class="skin-name">${skin.name}</div>
      <div class="skin-price">
        <span class="skin-badge ${skin.price === 0 ? "free" : isOwned ? "owned" : ""}">${badge}</span>
      </div>
    `;
    card.prepend(preview);

    const btn = document.createElement("button");
    if (isActive) {
      btn.textContent = "✓ ACTIVE";
      btn.className = "buy-btn apply";
      btn.disabled = true;
    } else if (isOwned) {
      btn.textContent = "APPLY SKIN";
      btn.className = "buy-btn apply";
      btn.addEventListener("click", () => {
        saveSkin(skin.id);
        renderSkins(owned);
        loadSkin();
      });
    } else {
      btn.textContent = `BUY ¥${skin.price}`;
      btn.className = "buy-btn purchase";
      btn.addEventListener("click", async () => {
        btn.textContent = "Redirecting...";
        btn.disabled = true;
        const res = await fetch("/api/shop/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skinId: skin.id, playerId }),
        });
        const data = await res.json() as { url?: string; error?: string };
        if (data.url) {
          window.location.href = data.url;
        } else {
          btn.textContent = `BUY ¥${skin.price}`;
          btn.disabled = false;
          alert(data.error ?? "Checkout failed");
        }
      });
    }

    card.appendChild(btn);
    grid.appendChild(card);
  });
}
