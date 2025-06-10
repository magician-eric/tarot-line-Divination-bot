const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// 測試 webhook 是否收到 LINE 的訊息
app.post('/webhook', (req, res) => {
  console.log('收到來自 LINE 的訊息：', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.get('/', (req, res) => {
  res.send('Tarot Bot is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
