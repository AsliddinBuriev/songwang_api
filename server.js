const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const app = require("./app");





const server = app.listen(process.env.PORT || 3000, () => {
  console.log("the server is running on server 3000");
});

process.on('unhandledRejection', err => {
  console.log(err);
  server.close(() => {
    process.exit(1)
  })
})