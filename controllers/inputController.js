const qr = require("qrcode");
const Oracledb = require('oracledb')
const AppError = require("../utils/appError");
const sendQr = require("../utils/sendQr")

/*******  POST REQUEST *******/
exports.insertInput = async (req, res, next) => {
  let db;
  try {
    req.body.departure_date = new Date(req.body.departure_date)
    //destructure data req.body
    const {
      driver_name, phone_num, car_num, forwarder,
      destination_port, sonmyong, booking_num, departure_date,
      company_name, quantity, package, weight, volume
    } = { ...req.body };

    //generate random transaction_id
    const transaction_id = `${Math.floor(Math.random() * 100 + 1)}${Date.now()}`

    const enter_date = new Date(Date.now())

    //1.Save transaction into input table
    //a.make bind data
    const binds = [];
    for (let i = 0; i < company_name.length; i++) {
      binds.push(
        {
          transaction_id, enter_date, driver_name, phone_num, car_num,
          forwarder, destination_port, sonmyong, booking_num, departure_date,
          company_name: company_name[i], quantity: quantity[i],
          package: package[i], weight: weight[i], volume: volume[i]
        })
    }
    // b.make sql insert string
    const insert = `INSERT INTO input 
    VALUES(
      :transaction_id, :enter_date, :driver_name, :phone_num, 
      :car_num,:forwarder, :destination_port, :sonmyong, 
      :booking_num,:departure_date, :company_name, :quantity,
       :package,:weight, :volume
    )`
    // c. save transaction into input table
    db = await Oracledb.getConnection('pool');
    await db.executeMany(insert, binds, { autoCommit: false });

    //2.send qr code to phone_number
    const transactionLink = `http://${req.hostname}:3000/input/${transaction_id}`
    const result = await sendQr(transactionLink, transaction_id, next, phone_num)

    //3. if qrcode is sent
    if (result) {
      //a.commit changes to database
      await db.commit()
      //b. send response 
      res.status(200).json({
        status: 'success',
        message: '요청이 완료되었습니다!'
      })
    }
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
};

/*******  GET TRANSACTION *******/
exports.getTransaction = async (req, res, next) => {
  let db;
  try {
    //1. Make qr code url
    const qrImg = await qr.toDataURL(`http://${req.hostname}:3000/input/${req.params.id}`);

    //2. Get transaction data
    db = await Oracledb.getConnection('pool');
    const result = await db.execute(`SELECT *
    FROM input  
    WHERE transaction_id = '${req.params.id}'`);

    //3. Send error if no result
    if (result.rows.length === 0) {
      console.log(result.rows);
      return next(new AppError('No transaction is found', 404))
    }

    //4.Send data 
    res.status(200).json({
      status: 'success',
      data: formatData(result, qrImg) //formatData function below
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

//1. helper functions
function formatData(result, qrImg) {
  const data = {
    transaction_info: {
      driver_name: result.rows[0].DRIVER_NAME,
      phone_num: result.rows[0].PHONE_NUM,
      car_num: result.rows[0].CAR_NUM,
      forwarder: result.rows[0].FORWARDER,
      destination_port: result.rows[0].DESTINATION_PORT,
      sonmyong: result.rows[0].SONMYONG,
      booking_num: result.rows[0].BOOKING_NUM,
      departure_date: result.rows[0].DEPARTURE_DATE,
      enter_date: result.rows[0].ENTER_DATE,
      qr: qrImg
    },
    product_info: []
  };
  for (let i = 0; i < result.rows.length; i++) {
    data.product_info.push({
      company_name: result.rows[i].COMPANY_NAME,
      quantity: result.rows[i].QUANTITY,
      package: result.rows[i].PACKAGE,
      weight: result.rows[i].WEIGHT,
      volume: result.rows[i].VOLUME
    })
  }
  return data
}