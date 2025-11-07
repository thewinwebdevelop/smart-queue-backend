import { db } from "./firestore";
import { pushFlexMessage } from "../utils/lineMessaging";
import dayjs from "dayjs";

export async function reportAndClearQueue() {
  const today = dayjs().format("YYYY-MM-DD");
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

  const queuesSnapshot = await db.collection("queues").get();
  const reportResults: any[] = [];

  for (const doc of queuesSnapshot.docs) {
    const queueId = doc.id; // เช่น shop_001_2025-10-23
    const [shopId = "", date = ""] = queueId.split("_");
    if (!shopId || !date) continue;

    // 🔹 ลบข้อมูลคิวเก่าของวันก่อนหน้า
    if (date === yesterday) {
      await db.collection("queues").doc(queueId).delete();
      continue;
    }

    // 🔹 ส่งรายงานของวันนี้
    if (date === today) {
      const shopDoc = await db.collection("shops").doc(shopId).get();
      if (!shopDoc.exists) continue;

      const shop = shopDoc.data()!;
      const { name: shopName, owners, line_channel_token } = shop;
      const list = doc.data().list || [];

      if (!owners?.length || !line_channel_token) continue;

      // 🧾 Header message
      const headerText = `📋 รายงานคิวประจำวันที่ ${today}\nร้าน: ${shopName}\nจำนวนคิวทั้งหมด: ${list.length}`;

      // 🔹 Flex Bubble สำหรับแต่ละลูกค้า
      const customerBubbles = list.map((q: any, idx: number) => ({
        type: "box",
        layout: "horizontal",
        spacing: "sm",
        contents: [
          {
            type: "image",
            url:
              q.pictureUrl ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            size: "xxs",
            aspectMode: "cover",
            aspectRatio: "1:1",
            gravity: "center",
            margin: "sm",
            cornerRadius: "50%",
          },
          {
            type: "text",
            text: `${idx + 1}. ${q.lineName}${q.name ? ` (${q.name})` : ""}`,
            wrap: true,
            size: "sm",
            flex: 1,
          },
        ],
      }));

      // 🔹 Flex Message Body
      const flexContent = {
        type: "bubble",
        size: "mega",
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
                list.length > 0
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

      // 🔹 ส่ง Flex Message ไปหาเจ้าของร้าน
      await pushFlexMessage(
        line_channel_token,
        owners,
        `รายงานคิวประจำวันที่ ${today}`,
        flexContent
      );

      reportResults.push({ shopId, count: list.length });
    }
  }

  return reportResults;
}
