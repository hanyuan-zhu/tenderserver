const express = require('express');
const db = require('./db'); // 引入数据库操作模块
const axios = require('axios');
const config = require('./config'); // 引入配置文件

const router = express.Router();

// 辅助函数：数据库查询
async function queryDatabase(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// API端点：获取标书信息列表
router.get('/api/tenderIndex', async (req, res) => {
  try {
    const sql = `
      SELECT ti.* 
      FROM tender_index ti
      JOIN announcement_labels al ON ti.id = al.tender_id
      WHERE al.type_id IN (1, 2)
      ORDER BY ti.id DESC
    `;
    const results = await queryDatabase(sql);
    res.json(results);
  } catch (error) {
    console.error('Error executing query: ', error);
    res.status(500).json({ error: 'Error retrieving data from database' });
  }
});

// API端点：登录
router.post('/api/login', async (req, res) => {
  const { code, nickname } = req.body;
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.weixin.appId}&secret=${config.weixin.appSecret}&js_code=${code}&grant_type=authorization_code`;

  try {
    const response = await axios.get(url);
    const { openid, session_key,company_id } = response.data;
    console.log('nickname before insert:', nickname);
    const userExists = await queryDatabase('SELECT * FROM users WHERE openid = ?', [openid]);
    if (userExists.length === 0) {
      await queryDatabase('INSERT INTO users (openid, nickname) VALUES (?, ?)', [openid, nickname]);
      console.log('新用户已插入users表，包含nickname');
    } else {
      // Update existing user with the new nickname
      await queryDatabase('UPDATE users SET nickname = ? WHERE openid = ?', [nickname, openid]);
      console.log('用户nickname已更新');
      const company_id = await queryDatabase('SELECT company_id FROM users WHERE openid = ?', [openid]);
    }
    res.send({ openid, session_key, nickname,company_id });
  } catch (error) {
    console.error('登录失败', error);
    res.status(500).send('登录失败');
  }
});

// API端点：检查昵称
// router.post('/api/checkNickname', async (req, res) => {
//   const { openid } = req.body;
//   try {
//     const result = await queryDatabase('SELECT nickname FROM users WHERE openid = ?', [openid]);
//     if (result.length > 0 && result[0].nickname) {
//       res.json({ needNickname: false, nickName: result[0].nickname });
//       console.log('该用户已存在昵称：'+result[0].nickname);
//     } else {
//       res.json({ needNickname: true });
//       console.log('该用户还没有存昵称');
//     }
//   } catch (error) {
//     console.error('数据库查询失败', error);
//     res.status(500).send('数据库查询失败');
//   }
// });

// API端点：更新昵称
// router.post('/api/updateNickname', async (req, res) => {
//   const { openid, nickname } = req.body;
//   try {
//     await queryDatabase('UPDATE users SET nickname = ? WHERE openid = ?', [nickname, openid]);
//     res.send({ success: true });
//   } catch (error) {
//     console.error('数据库更新失败', error);
//     res.status(500).send('数据库更新失败');
//   }
// });

// API端点：获取标书详情
router.get('/api/tenderDetail', async (req, res) => {
  try {
    // 从请求中获取id参数
    const { id } = req.query;
    // 使用参数化查询来防止SQL注入
    const sql = 'SELECT * FROM tender_detail WHERE tender_id = ?';
    const results = await queryDatabase(sql, [id]);
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Error executing query: ', error);
    res.status(500).json({ error: 'Error retrieving data from database' });
  }
});



module.exports = router;