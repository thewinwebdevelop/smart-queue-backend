import { reportAndClearQueue } from "../services/reportService";
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
    const result = await reportAndClearQueue();
    res.json({
      success: true,
      message: "Daily reports sent and old queues cleared.",
      result,
    });
  } catch (err: any) {
    console.error("Report error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}
