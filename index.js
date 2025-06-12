const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  console.log('✅ LINE webhook 收到請求');
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text.trim();
      const replyToken = event.replyToken;
      const userId = event.source.userId;

      if (userMessage === '我想占卜') {
        // ✅ 這裡原本是一次性 reply
        // await replyText(replyToken, [...]);

        // ✅ 改成這樣（用 push，一句一句講）
        sendStepMessages(userId, [
          '好的，那我先洗牌',
          '正在洗牌...',
          '啪啦啪啦啪啦啪啦...',
          '洗好了...',
          '請問你這次想抽幾張牌？請輸入 1～5 的數字'
        ]);
      }
    }
  }

  // 一定要回應 LINE API 一個 200 OK
  res.status(200).end();
});
app.get('/', (req, res) => {
  res.send('🔮 Tarot Bot Server is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

async function sendStepMessages(userId, messages, delay = 800) {
  for (let i = 0; i < messages.length; i++) {
    await new Promise(resolve => setTimeout(resolve, i * delay));
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [{ type: 'text', text: messages[i] }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_TOKEN}`
        }
      }
    );
  }
}
