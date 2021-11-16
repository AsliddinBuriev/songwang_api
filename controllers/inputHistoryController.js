const Oracledb = require('oracledb')

//conver date format to search oracledb date format
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const standartDate = new Date(date);
  const format = standartDate.toLocaleString('en-GB', options).split(' ');
  return `${format[0].padStart(2, "0")}-${format[1].toUpperCase()}-${format[2]}`
}

/*******  GET TRANSACTION  HISTORY  *******/
exports.getInputHistory = async (req, res, next) => {
  let db;
  try {
    const { from, to, driver_name } = { ...req.query }
    //make customized sql query string out of req.query
    let query = '';
    if (!from && !to && !driver_name) {
      query += `WHERE enter_date >= TO_DATE('${formatDate(Date.now())}','dd-MON-yy')`
    } else {
      query += `WHERE enter_date >= TO_DATE('${formatDate(from)}','dd-MON-yy') 
      AND enter_date <= TO_DATE('${formatDate(to)}','dd-MON-yy') 
      AND driver_name = '${driver_name}'`
    }
    db = await Oracledb.getConnection('pool');
    const result = await db.execute(`SELECT driver_name, phone_number, enter_date
    FROM input ${query}
    ORDER BY enter_date DESC`);
    //send response 
    res.status(200).json({
      status: 'success',
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