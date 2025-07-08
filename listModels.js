require("dotenv").config();
const axios = require("axios");

async function listModels() {
  try {
    const response = await axios.get(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );
    console.log("✅ Danh sách model bạn có quyền sử dụng:");
    console.log(response.data.models);
  } catch (error) {
    console.error("❌ Lỗi khi gọi API:", error.response?.data || error.message);
  }
}

listModels();
