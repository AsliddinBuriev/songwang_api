const dotenv = require("dotenv");
const Oracledb = require("oracledb")
dotenv.config({ path: "./config.env" });
const app = require("./app");
const path = require('path')


Oracledb.outFormat = Oracledb.OUT_FORMAT_OBJECT;
// Oracledb.initOracleClient({ libDir: '/opt/oracle/instantclient_21_3/' });
const db = async () => {
  const pool = await Oracledb.createPool({
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    connectionString: process.env.DBCONNECTIONSTR,
    enableStatistics: true,
    poolAlias: 'pool',
    poolIncrement: 0,
    poolMax: 2,
    poolMin: 2,
  })
  // pool.logStatistics()
}


const server = app.listen(process.env.PORT || 3000, () => {
  db()
  console.log("the server is running on server 3000");
});

process.on('unhandledRejection', err => {
  console.log(err);
  server.close(() => {
    Oracledb.getPool().close(10, (err) => {
      console.log(err);
    })
    process.exit(1);
  })
})