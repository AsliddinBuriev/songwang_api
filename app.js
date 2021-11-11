const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const app = express();
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const cors = require('cors')

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use(cors());

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

app.all('*', (req, res, next) => {
  next(new AppError('Cannot find your requested url on this server!', 404));
})

//error handling middleware

app.use(globalErrorHandler)

module.exports = app;