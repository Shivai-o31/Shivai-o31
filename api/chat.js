import { Configuration, OpenAIApi } from "openai";

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Only POST requests allowed", { status: 405 });
  }

  const { message } = await req.json();

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    });

    return new Response(JSON.stringify({ reply: completion.data.choices[0].message.content }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "OpenAI se response nahi aaya." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
