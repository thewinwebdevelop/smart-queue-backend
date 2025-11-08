import { db } from "./firestore";
import dayjs from "dayjs";
import { getDistanceFromLatLonInM } from "../utils/distance";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

interface CheckInParams {
  userId: string;
  name: string;
  profileUrl: string;
  shopId: string;
  lat: number;
  lng: number;
}
interface QueueParams {
  userId: string;
  shopId: string;
}

export async function checkInUser({
  userId,
  name,
  profileUrl,
  shopId,
  lat,
  lng,
}: CheckInParams) {
  const shopDoc = await db.collection("shops").doc(shopId).get();
  if (!shopDoc.exists) throw new Error("shop_not_found");

  const shop = shopDoc.data()!;
  const { latlng, checkin_start_time, checkin_end_time } = shop;
  const shopLat = latlng._latitude;
  const shopLng = latlng._longitude;
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const now = dayjs().tz("Asia/Bangkok");
  const currentTime = now.format("HH:mm");
  const today = now.format("YYYY-MM-DD");

  if (currentTime < checkin_start_time || currentTime > checkin_end_time) {
    console.error(
      `[Checkin User]: Error checkin close with currentTime is ${currentTime},, checkin_start_time is ${checkin_start_time},, checkin_end_time is ${checkin_end_time}`
    );
    throw new Error("checkin_closed");
  }

  const distance = getDistanceFromLatLonInM(lat, lng, shopLat, shopLng);
  if (distance > 10) {
    console.error(
      `[Checkin User]: Error out of range with lat is ${lat},, lng is ${lng},, distance is ${distance}`
    );
    throw new Error("out_of_range");
  }

  const queueDocRef = db
    .collection("shops")
    .doc(shopId)
    .collection("queues")
    .doc(today);

  await queueDocRef.set({ createdAt: now.toISOString() });

  const userDocRef = queueDocRef.collection("queueUsers").doc(userId);

  const userDoc = await userDocRef.get();
  if (userDoc.exists) {
    return userDoc.data();
  }

  const queueUsersSnap = await db
    .collection("shops")
    .doc(shopId)
    .collection("queues")
    .doc(today)
    .collection("queueUsers")
    .get();

  const queueNumber = queueUsersSnap.size + 1;

  const newQueue = {
    userId,
    name,
    profileUrl,
    queueNumber,
    timestamp: now.toISOString(),
  };

  await userDocRef.set(newQueue);

  return newQueue;
}

export async function getQueue({ userId, shopId }: QueueParams) {
  const now = dayjs().tz("Asia/Bangkok");
  const today = now.format("YYYY-MM-DD");

  const userDocRef = db
    .collection("shops")
    .doc(shopId)
    .collection("queues")
    .doc(today)
    .collection("queueUsers")
    .doc(userId);

  const userDoc = await userDocRef.get();
  if (!userDoc.exists) {
    throw new Error("data not found");
  }
  return userDoc.data();
}
