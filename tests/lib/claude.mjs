/** Answer /v1/messages with a streamed reply and record each request body. */
export async function mockClaude(page, replyText) {
  const bodies = [];
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "POST, OPTIONS" };
  await page.route("https://api.anthropic.com/v1/messages", async (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    bodies.push(JSON.parse(route.request().postData()));
    const ev = (o) => `event: ${o.type}\ndata: ${JSON.stringify(o)}\n\n`;
    await route.fulfill({
      status: 200, headers: { ...cors, "content-type": "text/event-stream" },
      body: ev({ type: "message_start", message: { usage: { input_tokens: 100, output_tokens: 1 } } })
        + ev({ type: "content_block_start", index: 0, content_block: { type: "text", text: "" } })
        + ev({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: replyText } })
        + ev({ type: "content_block_stop", index: 0 })
        + ev({ type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 42 } })
        + ev({ type: "message_stop" }),
    });
  });
  return bodies;
}
