
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Tải các biến môi trường từ tệp .env vào process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { GoogleGenAI, Type } = require('@google/genai');

const app = express();
// Sử dụng một cổng mặc định hoặc cổng từ biến môi trường
const port = process.env.PORT || 3000;

// Kích hoạt CORS để cho phép frontend (chạy trên một origin khác) có thể gọi API này
app.use(cors());
// Kích hoạt middleware để phân tích cú pháp JSON trong body của request
app.use(express.json());

// Kiểm tra xem API_KEY có tồn tại không
if (!process.env.API_KEY) {
  console.error("LỖI: Biến môi trường API_KEY chưa được thiết lập. Vui lòng tạo tệp .env và thêm API_KEY vào đó.");
  process.exit(1); // Dừng server nếu không có key
}

// Khởi tạo GoogleGenAI client với API Key từ biến môi trường
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Định nghĩa một endpoint POST tại /api/generate-advice
app.post('/api/generate-advice', async (req, res) => {
  try {
    // Lấy dữ liệu sản phẩm từ body của request
    const { product } = req.body;

    // Kiểm tra xem dữ liệu sản phẩm có được gửi không
    if (!product) {
      return res.status(400).json({ error: 'Dữ liệu sản phẩm bị thiếu trong yêu cầu.' });
    }

    // Gửi yêu cầu đến Gemini API, tương tự như logic ở frontend trước đây
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as an impartial expert product consultant. Based on the following product information, provide a concise analysis in Vietnamese for a potential customer.
      Product Name: ${product.name}
      Product Price: ${product.price}
      Product Description: ${product.description_detail || product.description}

      Your analysis should highlight key advantages, points to consider (including an evaluation of the price in relation to the described features and benefits), and a final summary about its overall value.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advantages: {
              type: Type.ARRAY,
              description: 'Key advantages of the product, in Vietnamese.',
              items: { type: Type.STRING }
            },
            considerations: {
              type: Type.ARRAY,
              description: 'Points for the customer to consider, or potential drawbacks, in Vietnamese. This should include a comment on the price vs. value.',
              items: { type: Type.STRING }
            },
            summary: {
              type: Type.STRING,
              description: 'A final summary and recommendation about the product\'s overall value, in Vietnamese.'
            }
          },
          required: ['advantages', 'considerations', 'summary']
        },
      },
    });
    
    // Trả về kết quả từ Gemini dưới dạng JSON cho frontend
    // Gói kết quả vào một đối tượng để dễ dàng mở rộng trong tương lai
    res.json({ advice: response.text });

  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    res.status(500).json({ error: 'Đã có lỗi xảy ra phía máy chủ khi tạo tư vấn.' });
  }
});

// Khởi động server và lắng nghe trên cổng đã định
app.listen(port, () => {
  console.log(`✅ Proxy server đang lắng nghe tại http://localhost:${port}`);
});
