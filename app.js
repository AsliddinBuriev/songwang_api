const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const app = express();
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
// const cors = require('cors')

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
// app.use(cors());
//add changes to test pipeline
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, PATCH, POST");
  next()
})

// output router
const outputRouter = require("./routes/outputRouter");
app.use("/api/v1/output", outputRouter);

// output_history router
const outputHistoryRouter = require('./routes/outputHistoryRouter');
app.use("/api/v1/output_history", outputHistoryRouter)

//input router
const inputRouter = require("./routes/inputRouter");
app.use("/api/v1/input", inputRouter);

// input_history router
const inputHistoryRouter = require('./routes/inputHistoryRouter');
app.use("/api/v1/input_history", inputHistoryRouter)

//wrong route
app.all('*', (req, res, next) => {
  next(new AppError('이 서버에서 요청한 URL을 찾을 수 없습니다!', 404));
})

//global error handler
app.use(globalErrorHandler)

module.exports = app;