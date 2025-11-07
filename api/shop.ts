import { getShopDetail } from "../services/shopService";
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
    const { shopId } = req.query;

    if (Array.isArray(shopId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid shopId parameter" });
    }
    console.info(`++++++ [Get Shop] ++++++`);
    console.info(`[Get Shop]: Request shopId is ${shopId}`);
    const shop = await getShopDetail(shopId);
    console.info({ shop }, `[Get Shop]: shop detail`);

    res.status(200).json({ success: true, data: shop });
  } catch (err: any) {
    console.error(`[Get Shop] Error: ${err}`);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    console.info(`++++++ [Get Shop] ++++++`);
  }
}
