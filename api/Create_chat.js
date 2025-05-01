const { Configuration, OpenAIApi } = require("openai");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json");
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  let rawBody = "";
  req.on("data", (chunk) => (rawBody += chunk));
  req.on("end", async () => {
    try {
      if (!rawBody) {
        res.setHeader("Content-Type", "application/json");
        return res.status(400).json({ error: "Request body is empty" });
      }

      let data;
      try {
        data = JSON.parse(rawBody);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError.message);
        res.setHeader("Content-Type", "application/json");
        return res.status(400).json({
          error: "Invalid JSON input. Please send a valid JSON object like {\"message\": \"your question\", \"context\": []}",
        });
      }

      const { message, context = [] } = data;

      if (!message || typeof message !== "string" || message.trim() === "") {
        res.setHeader("Content-Type", "application/json");
        return res.status(400).json({ error: "A valid non-empty message is required" });
      }

      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });

      if (!process.env.OPENAI_API_KEY) {
        res.setHeader("Content-Type", "application/json");
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAIApi(configuration);

      let systemPrompt = "You are a helpful and versatile AI assistant. Provide accurate, concise, and well-structured answers.";

      if (message.toLowerCase().includes("write a") || message.toLowerCase().includes("create a")) {
        systemPrompt = "You are a creative AI assistant. Generate creative and detailed content based on the user's request.";
      } else if (message.toLowerCase().includes("explain") || message.toLowerCase().includes("how")) {
        systemPrompt = "You are an expert teacher. Explain concepts clearly and step-by-step.";
      } else if (message.toLowerCase().includes("code") || message.toLowerCase().includes("program")) {
        systemPrompt = "You are a coding expert. Provide accurate code snippets with explanations.";
      }

      const messages = [
        { role: "system", content: systemPrompt },
        ...context.map((ctx) => ({
          role: ctx.role,
          content: ctx.content,
        })),
        { role: "user", content: message },
      ];

      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const answer = completion.data.choices[0].message.content.trim();

      let formattedResponse = { reply: answer };

      if (message.toLowerCase().includes("code") || message.toLowerCase().includes("program")) {
        const codeMatch = answer.match(/```[\s\S]*?```/);
        if (codeMatch) {
          const code = codeMatch[0].replace(/```/g, "").trim();
          formattedResponse = {
            reply: answer.replace(codeMatch[0], "").trim(),
            code: code,
          };
        }
      } else if (message.toLowerCase().includes("list") || message.toLowerCase().includes("steps")) {
        const lines = answer.split("\n").filter((line) => line.trim());
        formattedResponse = {
          reply: lines.map((line, index) => `${index + 1}. ${line}`).join("\n"),
        };
      }

      const updatedContext = [
        ...context,
        { role: "user", content: message },
        { role: "assistant", content: answer },
      ].slice(-10);

      res.setHeader("Content-Type", "application/json");
      res.status(200).json({
        ...formattedResponse,
        context: updatedContext,
      });
    } catch (err) {
      console.error("Server Error:", err.message);
      res.setHeader("Content-Type", "application/json");
      if (err.response) {
        return res.status(500).json({ error: `OpenAI API error: ${err.response.status} - ${err.response.data.error.message}` });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  req.on("error", (err) => {
    console.error("Request Error:", err.message);
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({ error: "Request error" });
  });
};
