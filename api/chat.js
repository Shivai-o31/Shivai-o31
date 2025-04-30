const { Configuration, OpenAIApi } = require("openai");

module.exports = async (req, res) => {
  // Check if the request method is POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

  // Accumulate the request body
  let rawBody = "";
  req.on("data", (chunk) => (rawBody += chunk));
  req.on("end", async () => {
    try {
      // Parse the request body as JSON
      if (!rawBody) {
        return res.status(400).json({ error: "Request body is empty" });
      }

      let data;
      try {
        data = JSON.parse(rawBody);
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid JSON input" });
      }

      const { message } = data;

      // Validate if message exists and is a non-empty string
      if (!message || typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({ error: "A valid message is required" });
      }

      // Configure OpenAI API
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const openai = new OpenAIApi(configuration);

      // Call OpenAI API to get the answer
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant that provides accurate and concise answers to user queries." },
          { role: "user", content: message },
        ],
        max_tokens: 500, // Limit the response length
        temperature: 0.7, // Control creativity (0 to 1)
      });

      // Extract the answer
      const answer = completion.data.choices[0].message.content.trim();

      // Send successful response
      res.status(200).json({ reply: answer });
    } catch (err) {
      console.error("Error:", err.message);
      // Handle OpenAI-specific errors
      if (err.response) {
        return res.status(500).json({ error: `OpenAI API error: ${err.response.status} - ${err.response.data.error.message}` });
      }
      // Handle other server errors
      res.status(500).json({ error: "Server error" });
    }
  });

  // Handle request errors
  req.on("error", () => {
    res.status(500).json({ error: "Request error" });
  });
};
