const axios = require("axios");
require("dotenv").config();

const chatWithGemini = async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    const result = response.data.candidates[0].content.parts[0].text;
    res.json({ reply: result });
  } catch (error) {
    console.error("Lỗi gọi Gemini:", error?.response?.data || error.message);
    res.status(500).json({ error: "Lỗi khi gọi Gemini API", details: error?.response?.data || error.message });
  }
};

module.exports = { chatWithGemini };
