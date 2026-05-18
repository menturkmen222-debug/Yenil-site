import { Router } from "express";
import { db, locationSharesTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";

const router = Router();

const DAILY_FREE_LIMIT = 3;

function randomToken(len = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

router.post("/location/create", async (req, res) => {
  const { deviceId } = req.body as { deviceId?: string };
  if (!deviceId) {
    return res.status(400).json({ error: "deviceId required" });
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [{ value: todayCount }] = await db
    .select({ value: count() })
    .from(locationSharesTable)
    .where(
      and(
        eq(locationSharesTable.creatorDeviceId, deviceId),
        gte(locationSharesTable.createdAt, dayStart),
      ),
    );

  if (Number(todayCount) >= DAILY_FREE_LIMIT) {
    return res.status(429).json({
      error: "daily_limit_reached",
      limit: DAILY_FREE_LIMIT,
      count: Number(todayCount),
    });
  }

  const token = randomToken(8);
  const id = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(locationSharesTable).values({
    id,
    creatorDeviceId: deviceId,
    token,
    lat: null,
    lon: null,
    status: "pending",
    expiresAt,
  });

  return res.json({
    token,
    expiresAt: expiresAt.toISOString(),
    remaining: DAILY_FREE_LIMIT - Number(todayCount) - 1,
  });
});

router.get("/location/share/:token", async (req, res) => {
  const { token } = req.params;
  const [share] = await db
    .select()
    .from(locationSharesTable)
    .where(eq(locationSharesTable.token, token))
    .limit(1);

  if (!share) return res.status(404).json({ error: "not_found" });

  if (share.status !== "expired" && new Date() > share.expiresAt) {
    await db
      .update(locationSharesTable)
      .set({ status: "expired" })
      .where(eq(locationSharesTable.token, token));
    return res.json({ ...share, status: "expired" });
  }

  return res.json(share);
});

router.post("/location/share/:token/submit", async (req, res) => {
  const { token } = req.params;
  const { lat, lon } = req.body as { lat?: number; lon?: number };

  if (typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ error: "lat and lon required" });
  }

  const [share] = await db
    .select()
    .from(locationSharesTable)
    .where(eq(locationSharesTable.token, token))
    .limit(1);

  if (!share) return res.status(404).json({ error: "not_found" });
  if (share.status === "expired" || new Date() > share.expiresAt) {
    return res.status(410).json({ error: "expired" });
  }

  await db
    .update(locationSharesTable)
    .set({ lat, lon, status: "active" })
    .where(eq(locationSharesTable.token, token));

  return res.json({ ok: true, lat, lon });
});

router.get("/location/my-shares", async (req, res) => {
  const deviceId = req.query.deviceId as string;
  if (!deviceId) return res.status(400).json({ error: "deviceId required" });

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const shares = await db
    .select()
    .from(locationSharesTable)
    .where(
      and(
        eq(locationSharesTable.creatorDeviceId, deviceId),
        gte(locationSharesTable.createdAt, dayStart),
      ),
    )
    .orderBy(locationSharesTable.createdAt);

  return res.json({ shares, limit: DAILY_FREE_LIMIT, count: shares.length });
});

export default router;
