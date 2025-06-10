const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  console.log('✅ LINE webhook 收到請求');
  console.log('✅ 收到 LINE Webhook:', JSON.stringify(req.body, null, 2));

  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text.trim();
      const replyToken = event.replyToken;

      if (userMessage === '我想占卜') {
        await replyText(replyToken, [
          '好的，那我先洗牌',
          '正在洗牌...',
          '啪啦啪啦啪啦啪啦...',
          '洗好了...',
          '請問你這次想抽幾張牌？請輸入 1～5 的數字'
        ]);
      }
    }
  }

  res.sendStatus(200); // ✅ 補這行回覆 LINE
});

app.get('/', (req, res) => {
  res.send('🔮 Tarot Bot Server is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

async function replyText(replyToken, messages) {
  const replyMessages = messages.map(text => ({ type: 'text', text }));

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken,
        messages: replyMessages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_TOKEN}`
        }
      }
    );
    console.log('✅ 成功回覆 LINE 使用者');
  } catch (err) {
    console.error('❌ 回覆失敗：', err.response?.data || err.message);
  }
}
