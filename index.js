const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

const userStates = {}; // 使用者狀態暫存

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  console.log('✅ LINE webhook 收到請求');
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text.trim();
      const replyToken = event.replyToken;
      const userId = event.source.userId;

      // === 【第一步】啟動占卜流程 ===
      if (userMessage === '我想占卜') {
        userStates[userId] = { stage: 'await_card_count' };
        sendStepMessages(userId, [
          '好的，那我先洗牌',
          '正在洗牌...',
          '啪啦啪啦啪啦啪啦...',
          '洗好了...',
          '請問你這次想抽幾張牌？請輸入 1～5 的數字'
        ]);
        return;
      }

      // === 只有開啟占卜流程的狀態才會處理下面的邏輯 ===
      if (userStates[userId]?.stage === 'await_card_count') {
        const numberMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5 };
        const numMatch = userMessage.match(/([1-5]|[一二三四五壹貳參肆伍])/);

        if (numMatch) {
          let num = numMatch[1];
          if (isNaN(num)) {
            num = numberMap[num];
          } else {
            num = parseInt(num);
          }

          if (num >= 1 && num <= 5) {
            userStates[userId] = {
              stage: 'await_draw_method',
              numCards: num
            };

            await replyText(replyToken, [
              `好的，我幫你抽 ${num} 張牌 🃏`,
              `你想要怎麼抽？`,
              `1️⃣ 隨機抽`,
              `2️⃣ 自己輸入 ${num} 個數字（1～78 之間），例如：7 26 54`
            ]);
            return;
          }
        }

        await replyText(replyToken, [
          '請輸入 1～5 的數字，或中文數字（例如：三、五）'
        ]);
        return;
      }

      // === [之後擴充]：抽牌方式選擇與結果處理邏輯寫在這裡 ===
      if (userStates[userId]?.stage === 'await_draw_method') {
        await replyText(replyToken, ['📌（此功能尚未實作，稍後補上）']);
        return;
      }

      // 沒有任何占卜流程就忽略
    }
  }

  res.status(200).end();
});

app.get('/', (req, res) => {
  res.send('🔮 Tarot Bot Server is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// 🔁 一句一句講話用 push（非 reply）
function sendStepMessages(userId, messages) {
  const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;
  const url = 'https://api.line.me/v2/bot/message/push';

  messages.forEach((text, i) => {
    setTimeout(() => {
      axios.post(
        url,
        {
          to: userId,
          messages: [{ type: 'text', text }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LINE_TOKEN}`
          }
        }
      ).catch(err => {
        console.error('❌ Push Message 失敗:', err.response?.data || err.message);
      });
    }, i * 1000); // 每句間隔 1 秒
  });
}

// ✅ reply 回覆文字
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
          Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`
        }
      }
    );
    console.log('✅ 成功回覆 LINE 使用者');
  } catch (err) {
    console.error('❌ 回覆失敗：', err.response?.data || err.message);
  }
}

