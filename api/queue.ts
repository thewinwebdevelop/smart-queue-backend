import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getQueue } from "../services/queueService";
import { VERCEL_REGION_CONFIG } from "../utils/region";

export const config = VERCEL_REGION_CONFIG;
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const shopId = Array.isArray(req.query.shopId)
      ? req.query.shopId[0]
      : req.query.shopId;
    const userId = Array.isArray(req.query.userId)
      ? req.query.userId[0]
      : req.query.userId;

    if (!shopId || !userId) {
      return res
        .status(400)
        .json({ success: false, error: "shopId and userId invalid" });
    }
    console.info(`++++++ [Get Queue] ++++++`);
    console.info(`[Get Queue]: Request shopId is ${shopId}`);
    console.info(`[Get Queue]: Request userId is ${userId}`);

    const queue = await getQueue({ userId, shopId });
    console.info({ queue }, "[Get Queue]: queue detail");
    res.status(200).json({ success: true, data: queue });
  } catch (err: any) {
    console.info(`[Get Queue] Error: ${err}`);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    console.info(`++++++ [Get Queue] ++++++`);
  }
}
