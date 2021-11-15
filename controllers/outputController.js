const qr = require("qrcode");
// const connection = require("../models/configdb");
const Oracle = require('oracledb')
const catchAsyncErr = require('./../utils/catchAsyncErr');
const AppError = require("../utils/appError");
const sendQr = require("../utils/sendQr")

/*******  GET REQUEST *******/
exports.getOutput = catchAsyncErr(async (req, res, next) => {
  const { bl_num } = { ...req.query };
  //query output table 
  const db = await Oracle.getConnection();
  const data = await db.execute(
    `SELECT bl_num, company_name,quantity, unit 
    from output 
    where quantity > 0 and bl_num = '${bl_num}'`);
  await db.close();
  //send one product data
  res.status(200).json({
    mstatus: 'success',
    data: data.rows
  })
})

/*******  PATCH REQUEST *******/
exports.updateOutput = catchAsyncErr(async (req, res, next) => {
  const db = await Oracle.getConnection();
  //destruct data req.body
  const {
    bl_num, company_name, quantity, unit, driver_name, phone_num, car_num
  } = { ...req.body };

  //generate random transaction_id
  const transaction_id = `${Math.floor(Math.random() * 100 + 1)}${Date.now()}`
  const binds = []

  // 1.Update output table
  for (let i = 0; i < bl_num.length; i++) {
    //a.check if update request is OK
    const doesExist = await db.execute(
      `SELECT quantity FROM output 
      WHERE bl_num = '${bl_num[i]}' 
      AND company_name = '${company_name[i]}'
      AND unit = '${unit[i]}' 
      AND (quantity - '${quantity[i]}') >= 0`)

    //b.if not OK send error message
    if (doesExist.rows.length === 0) {
      await db.close()
      return next(new AppError('생산 정보를 잘못 입력했습니다. 다시 시도하십시오!', 400));
    }

    //c.if OK update output table
    await db.execute(
      `UPDATE output 
      SET quantity = quantity - '${quantity[i]}'
      WHERE bl_num = '${bl_num[i]}'`);

    //d.Make binds data 
    binds.push({
      driver_name, phone_num, car_num, transaction_id, bl_num: bl_num[i],
      quantity: quantity[i], unit: unit[i], dt: new Date(Date.now())
    })
  }

  //2.save transaction into output_history table
  const insert = `INSERT INTO output_history VALUES(
    :driver_name, :phone_num, :car_num, :transaction_id, 
    :bl_num, :quantity, :unit, :dt
  )`;
  const history = await db.executeMany(insert, binds, { autoCommit: false });

  //3.send qr code to phone_number
  const transactionLink = `http://${req.hostname}:3000/output/${transaction_id}`
  const result = await sendQr(transactionLink, transaction_id, next, phone_num)

  //4.if qrcode is sent
  if (result) {
    //a.commit changes to database
    await db.commit();
    await db.close();
    //b.send response 
    res.status(200).json({
      status: 'success',
      message: '요청이 완료되었습니다!'
    })
  } else {
    await db.close();
  }
})
/*******  GET A TRANSACTION *******/
exports.getTransaction = catchAsyncErr(async (req, res, next) => {
  //1. Make qr code url
  const qrImg = await qr.toDataURL(`http://${req.hostname}:3000/output/${req.params.id}`);

  //2. Get transaction data
  const db = await connection;
  const result = await db.execute(`
    SELECT o.bl_num, o.company_name, o.forwarder, o.type, o.unit, o.enter_date, 
    h.driver_name, h.phone_num, h.car_num, h.transaction_id, h.dt, h.quantity
    FROM output o, output_history h 
    WHERE h.transaction_id = '${req.params.id}' and o.bl_num = h.bl_num`);

  //3. Send error if no result
  if (result.rows.length === 0) {
    return next(new AppError('No transaction is found', 404));
  }

  //4.Send data 
  //a.restructure data
  const data = {
    transaction_info: {
      driver_name: result.rows[0].DRIVER_NAME,
      phone_num: result.rows[0].PHONE_NUM,
      car_num: result.rows[0].CAR_NUM,
      output_date: result.rows[0].DT,
      qr: qrImg
    },
    product_info: []
  };
  for (let i = 0; i < result.rows.length; i++) {
    data.product_info.push({
      bl_num: result.rows[i].BL_NUM,
      company_name: result.rows[i].COMPANY_NAME,
      forwarder: result.rows[i].FORWARDER,
      type: result.rows[i].TYPE,
      unit: result.rows[i].UNIT,
      enter_date: result.rows[i].ENTER_DATE
    })
  }
  //b. send data 
  res.status(200).json({
    status: 'success',
    data
  })
})