const Oracledb = require('oracledb')
const catchAsyncErr = require('./../utils/catchAsyncErr');

//conver date format to search oracledb date format
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const standartDate = new Date(date);
  const format = standartDate.toLocaleString('en-GB', options).split(' ');
  return `${format[0].padStart(2, "0")}-${format[1].toUpperCase()}-${format[2]}`
}

/*******  GET TRANSACTION HISTORY *******/
exports.getOutputHistory = async (req, res, next) => {
  let db;
  try {
    const { from, to, driver_name } = { ...req.query }
    //1.History search
    //a. make custom query string
    let query = ''
    if (!from && !to && !driver_name) {
      query += `WHERE dt >= TO_DATE('${formatDate(Date.now())}','dd-MON-yy')`
    } else {
      query += `WHERE dt >= TO_DATE('${formatDate(from)}','dd-MON-yy') 
      AND dt <= TO_DATE('${formatDate(to)}','dd-MON-yy') 
      AND driver_name = '${driver_name}'`;
    }
    //b.query database
    db = await Oracledb.getConnection('pool');
    const result = await db.execute(`
      SELECT driver_name, phone_num, dt
      FROM output_history ${query}
      ORDER BY dt DESC`);

    //2.Send response 
    res.status(200).json({
      status: 'success',
      result: result.rows.length,
      data: result.rows
    })
  } catch (err) {
    next(err)
  } finally {
    if (db) {
      db.close((err) => {
        if (err)
          console.log(err);
      })
    }
  }
}