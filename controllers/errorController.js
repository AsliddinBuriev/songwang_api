const AppError = require("../utils/appError");

const sendDevErr = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message
  })
}

const sendProdErr = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  } else {
    // console.log(err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    })
  }
}
//notEnoughBalance error #coolsms-node-sdk
const coolsmsErr = (err) => {
  const message = "QR code 잔액이 부족합니다"
  return new AppError(message, 402)
}
//oracle invalit number error
const oracleInvalidNumber = (err) => {
  const message = '수량, 중량 및 볼륨 값은 숫자로 입력해야 해 주세요!';
  return new AppError(message, 400)
}
//oracle too long value 
const oracleTooLongValue = (err) => {
  const message = '우리는 매우 긴 값을 저장할 수 없습니다. 더 짧은 값을 입력하십시오!'
  return new AppError(message, 400)
}


/*******   GOLOBAL ERROR HANDLER   *******/
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // console.log(err);
  if (process.env.NODE_ENV === 'development') {
    sendDevErr(err, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err)
    //notEnoughBalance error #coolsms-node-sdk
    if (err.name === "StatusCodeError") error = coolsmsErr(err);
    //oracle invalit number error
    if (err.errorNum === 1722) error = oracleInvalidNumber(err);
    //oracle too long value 
    if (err.errorNum === 12899) error = oracleTooLongValue(err);

    sendProdErr(error, res);
  }
}