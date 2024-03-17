// db.js
const mysql = require('mysql');
const config = require('./config');

const db = mysql.createConnection(config.database);

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to database');
});

module.exports = db;
