import { db } from "./firestore";
import { pushFlexMessage } from "../utils/lineMessaging";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

interface ReportParams {
  shopId: string;
}

async function deleteSubcollection(
  queueRef: FirebaseFirestore.DocumentReference
) {
  const usersSnapshot = await queueRef.collection("queueUsers").get();

  for (const userDoc of usersSnapshot.docs) {
    await userDoc.ref.delete(); // ลบแต่ละ user
  }
  await queueRef.delete();
  console.info(`Deleted ${usersSnapshot.size} documents in queueUsers`);
}

export async function reportAndClearQueue({ shopId }: ReportParams) {
  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const queuesSnapshot = await db
    .collection("shops")
    .doc(shopId)
    .collection("queues")
    .get();
  const reportResults: any[] = [];

  for (const doc of queuesSnapshot.docs) {
    const queueId = doc.id; // เช่น shop_001_2025-10-23
    if (!queueId) continue;
    // 🔹 ลบข้อมูลคิวเก่าของวันก่อนหน้า
    if (queueId === yesterday) {
      await deleteSubcollection(doc.ref);
      continue;
    }

    // 🔹 ส่งรายงานของวันนี้
    if (queueId === today) {
      const shopDoc = await db.collection("shops").doc(shopId).get();
      if (!shopDoc.exists) continue;
      const shop = shopDoc.data()!;
      const { name: shopName, ownerUserId, line_channel_token: token } = shop;
      const queueUserDoc = await doc.ref.collection("queueUsers").get();

      if (!ownerUserId?.length || !token) continue;

      // 🧾 Header message
      const headerText = `📋 รายงานคิวประจำวันที่ ${today}\nร้าน: ${shopName}\nจำนวนคิวทั้งหมด: ${queueUserDoc.size}`;
      // 🔹 Flex Bubble สำหรับแต่ละลูกค้า
      const customerBubbles = queueUserDoc.docs.map(
        (user: any, idx: number) => {
          const userDetail = user.data();
          return {
            type: "box",
            layout: "horizontal",
            spacing: "sm",
            contents: [
              {
                type: "text",
                text: `${idx + 1}. ${userDetail.name}`,
                wrap: true,
                size: "sm",
                flex: 1,
              },
            ],
          };
        }
      );

      // 🔹 Flex Message Body
      const flexContent = {
        type: "bubble",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: headerText,
              weight: "bold",
              size: "sm",
              wrap: true,
              color: "#1C1C1C",
              margin: "md",
            },
            {
              type: "separator",
              margin: "md",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "md",
              spacing: "sm",
              contents:
                queueUserDoc.size > 0
                  ? customerBubbles
                  : [
                      {
                        type: "text",
                        text: "ยังไม่มีลูกค้า check-in วันนี้",
                        size: "sm",
                        color: "#999999",
                      },
                    ],
            },
          ],
        },
      };

      //🔹 ส่ง Flex Message ไปหาเจ้าของร้าน
      await pushFlexMessage(
        token,
        ownerUserId,
        `รายงานคิวประจำวันที่ ${today}`,
        flexContent
      );

      reportResults.push({ shopId, count: queueUserDoc.size });
    }
  }

  return reportResults;
}
