const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// ✅ 這是你設定的狀態：開關是否啟用占卜功能
const isAutoReplyEnabled = true;

// ✅ 使用者狀態紀錄
const userStates = {};

// === Webhook 接收 LINE 訊息 ===
app.post('/webhook', async (req, res) => {
  console.log('✅ LINE webhook 收到請求');
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text.trim();
      const replyToken = event.replyToken;
      const userId = event.source.userId;

      // ✅ 判斷是否啟用占卜功能
      if (!isAutoReplyEnabled) {
        console.log('🚫 自動回應關閉中，忽略訊息');
        continue;
      }

      // ✅ 起始指令：我想占卜
      if (userMessage === '我想占卜') {
        sendStepMessages(userId, [
          '好的，那我先洗牌',
          '正在洗牌...',
          '啪啦啪啦啪啦啪啦...',
          '洗好了...',
          '請問你這次想抽幾張牌？請輸入 1～5 的數字'
        ]);
        return;
      }

      // ✅ 解析張數（1～5），含中文數字
      const numberMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5 };
      const numMatch = userMessage.match(/([1-5]|[一二三四五壹貳參肆伍])/);

      if (numMatch && !userStates[userId]?.stage) {
        let num = numMatch[1];
        if (isNaN(num)) {
          num = numberMap[num];
        } else {
          num = parseInt(num);
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

  res.status(200).end(); // 一定要給 LINE 回 200
});

// === 首頁測試用 ===
app.get('/', (req, res) => {
  res.send('🔮 Tarot Bot Server is running!');
});

// === 啟動 Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// === 一句一句傳送（Push）===
function sendStepMessages(userId, messages) {
  const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;
  const url = 'https://api.line.me/v2/bot/message/push';

  messages.forEach((message, i) => {
    setTimeout(() => {
      axios.post(
        url,
        {
          to: userId,
          messages: [{ type: 'text', text: message }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LINE_TOKEN}`
          }
        }
      ).then(() => {
        console.log(`✅ 傳送訊息：「${message}」`);
      }).catch(err => {
        console.error('❌ 傳送錯誤：', err.response?.data || err.message);
      });
    }, i * 1200); // 每句間隔 1.2 秒
  });
}

// === 回覆文字訊息 ===
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
