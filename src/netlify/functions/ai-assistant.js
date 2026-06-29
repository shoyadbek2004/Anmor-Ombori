// Bu fayl serverda ishlaydi — API key brauzerga hech qachon chiqmaydi.
// Netlify saytida: Site settings → Environment variables → ANTHROPIC_API_KEY qo'shing.

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Faqat POST so'rov qabul qilinadi" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY sozlanmagan. Netlify → Site settings → Environment variables." }),
    };
  }

  try {
    const { system, messages } = JSON.parse(event.body || "{}");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: system || "",
        messages: messages || [],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: data?.error?.message || "Anthropic API xatosi" }),
      };
    }

    const reply = data?.content?.find((c) => c.type === "text")?.text || "";
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
