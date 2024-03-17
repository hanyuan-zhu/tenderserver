// const express = require('express');
// const bodyParser = require('body-parser');
// const appRoutes = require('./routes');
// const config = require('./config');
// const app = express();

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(appRoutes);

// const port = config.server.port;
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const appRoutes = require('./routes');
const config = require('./config');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(appRoutes);

// SSL证书路径
const options = {
  key: fs.readFileSync('/home/lighthouse/server/privkey.pem'), // 私钥文件路径
  cert: fs.readFileSync('/home/lighthouse/server/fullchain.pem') // 证书文件路径
};

const port = config.server.port;

// 使用https模块和SSL选项创建服务器
https.createServer(options, app).listen(port, () => {
  console.log(`Server running on port ${port} with SSL`);
});

