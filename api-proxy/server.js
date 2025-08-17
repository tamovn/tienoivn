// server.js hoặc routes/gemini.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

app.post('/api/generate', async (req, res) => {
  const data = req.body;
  try {
    if (!data) {
      return res.status(400).json({ error: "Thiếu prompt trong request body" });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    // ✅ Tạo prompt từ JSON (tùy biến theo mục đích của bạn)
    const customPromt = `
      trở thành 1 chuyên gia tư vấn, dựa vào tên sản phẩm, mô tả ngắn, mô tả chi tiết hãy đánh giá sản phẩm này có thực sự phù hợp với nhau cầu của khách hàng hay không, và khuyến khích họ mua sản phẩm
    sau đó trả kết quả text dạng json duy nhất có cấu trúc 3 phần như sau interface ExpertAdvice {
    advantages: string[];
    considerations: string[];
    summary: string;
    }, thông tin sản phẩm là:

      Tên sản phẩm: ${data.name}
      Mô tả ngắn: ${data.description}
      Giá: ${data.price}
      Link: ${data.link}
      Hình ảnh: ${data.image}
      Loại: ${data.type}
      Tình trạng: ${data.status}
      Mô tả chi tiết: ${data.description_detail}
      Nút CTA: ${data.button_text}
    `;
    const formPromt = {
      contents: [
        {
          role: "user",
          parts: [{ text: customPromt }],
        },
      ],
    }
    const result = await model.generateContent(formPromt);
    const text = result.response.text();
    res.json({ result: text });
  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({ error: 'Gemini API failed' });
  }
});

app.listen(3000, () => {
  console.log('✅ Backend chạy tại http://localhost:3000');
});
