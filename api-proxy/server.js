import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from '@google/genai';

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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Endpoint tư vấn sản phẩm
app.post('/api/generate-advice', async (req, res) => {
  try {
    const { product } = req.body;
    if (!product) {
      return res.status(400).json({ error: 'Thiếu dữ liệu sản phẩm' });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as an impartial expert product consultant. Provide advice about: ${product}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
            considerations: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING }
          },
          required: ['advantages', 'considerations', 'summary']
        },
      },
    });

    const output =
      response.output_text ||
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "";

    res.json({ advice: output });

  } catch (error) {
    console.error("❌ Lỗi khi gọi Gemini API:", error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo tư vấn.' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${port}`);
});
