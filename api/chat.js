const { Configuration, OpenAIApi } = require("openai");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST requests allowed");
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

      res.status(200).json({ reply: completion.data.choices[0].message.content });
    } catch (err) {
      res.status(500).json({ error: "OpenAI error ya input galat hai." });
    }
  });
};
