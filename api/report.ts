import { reportAndClearQueue } from "../services/reportService";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { VERCEL_REGION_CONFIG } from "../utils/region";
export const config = VERCEL_REGION_CONFIG;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end("Unauthorized");
  }
  const shopId = Array.isArray(req.query.shopId)
    ? req.query.shopId[0]
    : req.query.shopId;

  if (!shopId) {
    return res.status(400).json({ success: false, error: "shopId" });
  }
  try {
    console.info(`++++++ [Report] ++++++`);
    console.info(`[Report]: Request shopId is ${shopId}`);
    const result = await reportAndClearQueue({ shopId });
    console.info({ result }, "[Report]: Report detail");
    res.json({
      success: true,
      message: "Daily reports sent and old queues cleared.",
      result,
    });
  } catch (err: any) {
    console.error("[Report] error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    console.info(`++++++ [Report] ++++++`);
  }
}
