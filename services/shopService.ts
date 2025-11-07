import { db } from "./firestore";

export async function getShopDetail(shopId: string) {
  const doc = await db.collection("shops").doc(shopId).get();
  if (!doc.exists) throw new Error("shop_not_found");

  const data = doc.data()!;

  return {
    id: shopId,
    name: data.name,
    lat: data.latlng._latitude,
    lng: data.latlng._longitude,
    checkin_start: data.checkin_start_time,
    checkin_end: data.checkin_end_time,
  };
}
