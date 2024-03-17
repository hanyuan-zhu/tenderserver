const express = require('express');
const mysql = require('mysql');
const axios = require('axios'); 
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 配置腾讯云MySQL数据库连接
const db = mysql.createConnection({
  connectTimeout: 10000,
  host: 'gz-cdb-5scrcjb5.sql.tencentcdb.com',
  user: 'db',
  password: 'dbdb905905',
  database: 'sele',
  port:63432,
  charset: 'utf8mb4'
});

// 连接数据库
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to database');
});

// 创建列表展示的API端点
app.get('/api/tenderIndex', (req, res) => {
  // 构建SQL查询语句
    const sql = 'SELECT * FROM tender_index';
  // 执行查询
  // db.query(sql, (err, results) => {
//   if (err) {
    //   console.error('Error executing query: ', err);
      //res.status(500).json({ error: 'Error retrieving data from database' });
      //return;
    //}
    // 将查询结果发送给客户端
    //res.json(results);
  //});
    db.query(sql, (err, results) => {
    if (err) {
      console.error('Error executing query: ', err);
      res.status(500).json({ error: 'Error retrieving data from database' });
    } else {
      // 格式化每个记录中的publish_time字段
      const formattedResults = results.map(record => {
        // 如果record.publish_time存在且不是null
        if (record.publish_time) {
          // 将日期时间转换为'YYYY-MM-DD HH:MM'格式   ${hours}:${minutes}
          let date = new Date(record.publish_time);
          let year = date.getFullYear(); 
          let month = (date.getMonth() + 1).toString().padStart(2, '0'); // 将月份格式化为两位数
          let day = date.getDate().toString().padStart(2, '0'); // 将日期格式化为两位数
          let hours = date.getHours().toString().padStart(2, '0'); // 将小时格式化为两位数
          let minutes = date.getMinutes().toString().padStart(2, '0'); // 将分钟格式化为两位数
          record.publish_time = `${year}-${month}-${day}`;
        }
        return record;
      });
      // 将格式化后的结果发送给客户端
      res.json(formattedResults);
    }
  });

});


app.post('/api/login', async (req, res) => {
  const { code } = req.body;
  const appId = 'wxc503d58ec53defec';
  const appSecret = 'b852eeb4195c89caea7e66c7ff684881';
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

  try {
    const response = await axios.get(url);
    const { data } = response;
    // 获取到openid和session_key
    const { openid, session_key } = data;

    // 在这里插入检查数据库中是否存在该openid的逻辑
    const checkUserSql = 'SELECT * FROM users WHERE openid = ?';
    db.query(checkUserSql, [openid], (err, result) => {
      if (err) {
        console.error('数据库查询失败', err);
        return res.status(500).send('数据库查询失败');
      }
      
      if (result.length === 0) {
        // 如果没有找到用户，插入新用户
        const insertUserSql = 'INSERT INTO users (openid) VALUES (?)';
        db.query(insertUserSql, [openid], (insertErr, insertResult) => {
          if (insertErr) {
            console.error('插入用户失败', insertErr);
            return res.status(500).send('插入用户失败');
          }
          console.log('新用户添加成功', insertResult);
          // 这里可以继续后续逻辑，比如返回成功登录的响应
          res.send({openid, session_key, newUser: true});
        });
      } else {
        // 用户已存在
        console.log('用户已存在');
        res.send({openid, session_key, newUser: false});
      }
    });
    
  } catch (error) {
    console.error('登录失败', error);
    res.status(500).send('登录失败');
  }
});

app.post('/api/checkNickname', (req, res) => {
  const { openid } = req.body;

  // 定义一个查询昵称的 SQL 语句
  const getNicknameSql = 'SELECT nickname FROM users WHERE openid = ?';

  // 执行查询
  db.query(getNicknameSql, [openid], (err, result) => {
    if (err) {
      console.error('数据库查询失败', err);
      return res.status(500).send('数据库查询失败');
    }

    // 检查结果中是否有昵称
    if (result.length > 0 && result[0].nickname) {
      // 如果有昵称
      res.json({
        needNickname: false,
        nickName: result[0].nickname // 返回昵称
      });
    } else {
      // 如果没有昵称
      res.json({needNickname: true});
    }
  });
});

app.post('/api/updateNickname', (req, res) => {
  const { openid, nickname } = req.body;
  console.log('openid:', openid); // 打印 openid
  console.log('nickname:', nickname); // 打印 nickname
  // 定义一个更新昵称的 SQL 语句
  const updateNicknameSql = 'UPDATE users SET nickname = ? WHERE openid = ?';

  // 执行更新
  db.query(updateNicknameSql, [nickname, openid], (err, result) => {
    if (err) {
      console.error('数据库更新失败', err);
      return res.status(500).send('数据库更新失败');
    }
    console.log('更新结果:', result); // 打印更新结果
    // 返回成功响应
    res.send({ success: true });
  });
});

// 启动服务器
const port = 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});