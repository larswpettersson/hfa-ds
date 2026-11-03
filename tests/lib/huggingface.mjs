/** Answer the Hugging Face router (OpenAI-compatible chat completions and model list) and record each request. */
export async function mockHuggingFace(page, replyText, { status = 200 } = {}) {
  const requests = [];
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, OPTIONS" };
  await page.route("https://router.huggingface.co/v1/**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const json = (body, s = 200) => route.fulfill({ status: s, headers: { ...cors, "content-type": "application/json" }, body: JSON.stringify(body) });
    if (req.url().endsWith("/models")) return json({ object: "list", data: [{ id: "google/gemma-4-31B-it" }, { id: "Qwen/Qwen3-32B" }] });
    requests.push({ headers: req.headers(), body: JSON.parse(req.postData()) });
    if (status !== 200) return json({ error: "payment required" }, status);
    return json({ choices: [{ message: { role: "assistant", content: replyText }, finish_reason: "stop" }], usage: { prompt_tokens: 1200, completion_tokens: 80 } });
  });
  return requests;
}
