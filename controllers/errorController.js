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
    console.log(err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    })
  }
}


module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevErr(err, res)
  } else if (process.env.NODE_ENV === 'production') {
    const error = { ...err };
    //handle notEnoughBalance error

    sendProdErr(error, res);
  }
}