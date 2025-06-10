const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000; // Render 要求使用 process.env.PORT

app.use(bodyParser.json());

// webhook 測試 endpoint
app.post('/webhook', (req, res) => {
  console.log('✅ 收到 LINE Webhook:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// 根目錄測試 endpoint
app.get('/', (req, res) => {
  res.send('🔮 Tarot Bot Server is running!');
});

// 必須有這行才能讓 Render 知道你的 server 是活的！
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
