import axios from "axios";

/**
 * ส่ง Flex Message ผ่าน Messaging API
 */
export async function pushFlexMessage(
  accessToken: string,
  userIds: string[],
  altText: string,
  flexContent: any
) {
  const body = {
    to: userIds,
    messages: [
      {
        type: "flex",
        altText,
        contents: flexContent,
      },
    ],
  };
  console.info({ body }, "[Report-PushFlexMessage]: body detail");
  console.info(`[Report-PushFlexMessage]: accessToken is ${accessToken}`);

  await axios.post("https://api.line.me/v2/bot/message/multicast", body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
