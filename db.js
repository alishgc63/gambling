// db.js
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12725007',
    password: 'kXysuqUgZc',
    database: 'sql12725007'
});

const promisePool = pool.promise();

module.exports = promisePool;
