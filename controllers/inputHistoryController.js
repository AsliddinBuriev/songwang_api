const connection = require("../models/configdb");
const catchAsyncErr = require('./../utils/catchAsyncErr');

//conver date format to search oracledb date format
const formatDate = (date) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const standartDate = new Date(date);
  const format = standartDate.toLocaleString('en-GB', options).split(' ');
  return `${format[0].padStart(2, "0")}-${format[1].toUpperCase()}-${format[2]}`
}

/*******  GET TRANSACTION  HISTORY  *******/
exports.getInputHistory = catchAsyncErr(async (req, res, next) => {
  const { from, to, driver_name } = { ...req.query }

  //make customized sql query string out of req.query
  let query = '';
  if (!from && !to && !driver_name) {
    query += `WHERE enter_date = TO_DATE('${formatDate(Date.now())}','dd-MON-yy')`
  } else {
    query += `WHERE enter_date >= TO_DATE('${formatDate(from)}','dd-MON-yy') AND enter_date <= TO_DATE('${formatDate(to)}','dd-MON-yy') AND driver_name = '${driver_name}'`
  }
  const db = await connection;
  const result = await db.execute(`SELECT driver_name, phone_number, enter_date
  FROM input ${query}`);

  //send response 
  res.status(200).json({
    status: 'success',
    data: result.rows
  })

})