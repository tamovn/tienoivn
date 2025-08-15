import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Kiểm tra API key
if (!process.env.API_KEY) {
  console.error("❌ LỖI: Chưa thiết lập API_KEY trong file .env");
  process.exit(1);
}

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Endpoint tư vấn sản phẩm
app.post('/api/generate-advice', async (req, res) => {
  try {
    const { product } = req.body;
    if (!product) {
      return res.status(400).json({ error: 'Thiếu dữ liệu sản phẩm' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Act as an impartial expert product consultant.
      Provide advice about the following product: "${product}".
      Your response should include:
      - A list of advantages
      - A list of considerations or potential drawbacks
      - A short summary
      Format your response as JSON with keys: advantages, considerations, summary.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Cố gắng parse JSON từ phản hồi
    let advice;
    try {
      advice = JSON.parse(text);
    } catch (err) {
      console.warn("⚠️ Không thể parse JSON từ phản hồi Gemini. Trả về dạng text.");
      advice = { raw: text };
    }

    res.json({ advice });

  } catch (error) {
    console.error("❌ Lỗi khi gọi Gemini API:", error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo tư vấn.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${port}`);
});
