const { Configuration, OpenAIApi } = require("openai");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST requests allowed" });
    }

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body);
        const { message } = parsed;

        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const openai = new OpenAIApi(configuration);

        const completion = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }],
        });

        res.setHeader("Content-Type", "application/json");
        res.status(200).end(JSON.stringify({ reply: completion.data.choices[0].message.content }));
      } catch (error) {
        console.error("Parsing or OpenAI error:", error.message);
        res.setHeader("Content-Type", "application/json");
        res.status(500).end(JSON.stringify({ error: "Invalid input or OpenAI failed." }));
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server crashed." });
  }
};
