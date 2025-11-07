import { checkInUser } from "../services/queueService";
import type { VercelRequest, VercelResponse } from "@vercel/node";
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
    console.info(`++++++ [Checkin User] ++++++`);
    console.info(`[Checkin User]: Request body is ${req.body}`);
    const queue = await checkInUser(req.body);
    res.status(200).json({ success: true, data: queue });
  } catch (err: any) {
    console.error(`[Checkin User] Error : ${err}`);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    console.info(`++++++ [Checkin User] ++++++`);
  }
}
