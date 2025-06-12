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
      const numberMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5 };
let match = userMessage.match(/(?:抽|想抽|想要抽|我要抽)?\s*([1-5一二三四五壹貳參肆伍])\s*張?/);

if (match) {
  let num = match[1];
  if (isNaN(num)) {
    num = numberMap[num]; // 中文數字轉數字
  } else {
    num = parseInt(num); // 阿拉伯數字
  }

  if (num >= 1 && num <= 5) {
    userStates[userId] = { stage: 'await_draw_method', numCards: num };
    await replyText(replyToken, [
      `好的，我幫你抽 ${num} 張牌 🃏`,
      `你想要怎麼抽？`,
      `1️⃣ 隨機抽`,
      `2️⃣ 自己輸入 ${num} 個數字（1～78 之間），例如：7 26 54`
    ]);
    return;
  }
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
