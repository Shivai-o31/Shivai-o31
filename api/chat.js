const { Configuration, OpenAIApi } = require("openai");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST requests allowed" });
    return;
  }

  try {
    // Accumulate the body data (safe method)
    let rawBody = "";
    req.on("data", chunk => (rawBody += chunk));
    req.on("end", async () => {
      try {
        const { message } = JSON.parse(rawBody);

        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const openai = new OpenAIApi(configuration);

        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        });

        res.setHeader("Content-Type", "application/json");
        res.status(200).send(JSON.stringify({ reply: completion.data.choices[0].message.content }));
      } catch (err) {
        console.error("OpenAI or parse error:", err.message);
        res.setHeader("Content-Type", "application/json");
        res.status(500).send(JSON.stringify({ error: "OpenAI error or invalid input." }));
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Unexpected server error." });
  }
};
