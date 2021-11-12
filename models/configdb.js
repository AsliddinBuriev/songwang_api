const Oracledb = require('oracledb');
//Database connection 
//fix the bug related to connection and pool 
Oracledb.outFormat = Oracledb.OUT_FORMAT_OBJECT;
let connection = Oracledb.getConnection({
  user: process.env.DBUSER,
  password: process.env.DBPASSWORD,
  connectionString: process.env.DBCONNECTIONSTR
})

module.exports = connection;


