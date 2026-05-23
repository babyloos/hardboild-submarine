/**
 * スキンショップ API
 * POST /api/shop/checkout  → Stripe Checkout セッション作成
 * POST /api/shop/webhook   → Stripe Webhook（購入完了処理）
 * GET  /api/shop/skins     → 販売スキン一覧
 */

import { Router, Request, Response } from "express";
import https from "https";
import { SKINS } from "../../shared/skins";

const router = Router();

// ── スキン一覧 ─────────────────────────────────────────────────────────────
router.get("/skins", (_req: Request, res: Response) => {
  res.json(SKINS.map(({ id, name, price }) => ({ id, name, price })));
});

// ── Stripe Checkout セッション作成 ────────────────────────────────────────
router.post("/checkout", async (req: Request, res: Response) => {
  const { skinId, playerId } = req.body as { skinId: string; playerId: string };

  const skin = SKINS.find((s) => s.id === skinId);
  if (!skin || skin.price === 0) {
    return res.status(400).json({ error: "Invalid skin" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(503).json({ error: "Stripe not configured" });
  }

  // Stripe API: Create Checkout Session
  const body = new URLSearchParams({
    "payment_method_types[]": "card",
    "line_items[0][price_data][currency]": "jpy",
    "line_items[0][price_data][product_data][name]": `Skin: ${skin.name}`,
    "line_items[0][price_data][unit_amount]": String(skin.price),
    "line_items[0][quantity]": "1",
    "mode": "payment",
    "success_url": `${process.env.BASE_URL ?? "http://localhost:3000"}/shop/success?skin=${skinId}&player=${playerId}`,
    "cancel_url":  `${process.env.BASE_URL ?? "http://localhost:3000"}/shop`,
    "metadata[skin_id]":   skinId,
    "metadata[player_id]": playerId,
  }).toString();

  const options = {
    hostname: "api.stripe.com",
    path: "/v1/checkout/sessions",
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const stripeReq = https.request(options, (stripeRes) => {
    let data = "";
    stripeRes.on("data", (chunk: string) => (data += chunk));
    stripeRes.on("end", () => {
      const session = JSON.parse(data);
      if (session.error) return res.status(400).json({ error: session.error.message });
      res.json({ url: session.url });
    });
  });
  stripeReq.on("error", () => res.status(500).json({ error: "Stripe request failed" }));
  stripeReq.write(body);
  stripeReq.end();
});

// ── Stripe Webhook ────────────────────────────────────────────────────────
// 購入完了時に購入済みスキンをセッションに付与
// 本番ではDBに保存 (現状: インメモリ)
const purchasedSkins = new Map<string, Set<string>>(); // playerId → Set<skinId>

router.post("/webhook", (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Signature verification (simplified — use stripe library in production)
  if (!webhookSecret || !sig) {
    return res.status(400).json({ error: "Missing signature" });
  }

  const event = req.body as { type: string; data: { object: Record<string, unknown> } };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata: { skin_id: string; player_id: string };
    };
    const { skin_id, player_id } = session.metadata;
    if (!purchasedSkins.has(player_id)) purchasedSkins.set(player_id, new Set());
    purchasedSkins.get(player_id)!.add(skin_id);
    console.log(`[Shop] Player ${player_id} purchased skin: ${skin_id}`);
  }

  res.json({ received: true });
});

// ── 購入済みスキン確認 ─────────────────────────────────────────────────────
router.get("/owned/:playerId", (req: Request, res: Response) => {
  const owned = purchasedSkins.get(req.params.playerId) ?? new Set<string>();
  res.json({ owned: ["default", ...Array.from(owned)] });
});

export { router as shopRouter };
