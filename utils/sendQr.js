const qr = require("qrcode");
const pngToJpeg = require("png-to-jpeg");
const { msg, config } = require("coolsms-node-sdk");
const fs = require("fs");
const path = require("path");
const AppError = require("./appError");

// send qr code to phone_number
const sendQr = async (transactionLink, transaction_id, next, phone_num) => {
  try {
    //a.generate qrcode
    const qrImageLink = await qr.toDataURL(transactionLink);

    //b. generate jpeg file
    const buffer = Buffer.from(qrImageLink.split(/,\s*/)[1], "base64");
    const qrImage = await pngToJpeg({ quality: 90 })(buffer);
    fs.writeFileSync(`${__dirname}/qr_imgs/${transaction_id}.jpeg`, qrImage);

    //c. send qr code
    //coolsms-node-sdk config
    // config.init({
    //   apiKey: process.env.APIKEY,
    //   apiSecret: process.env.APISECRET,
    // });
    // const { fileId } = await msg.uploadMMSImage(
    //   `${__dirname}/qr_imgs/${transaction_id}.jpeg`
    // );
    // const result = await msg.send({
    //   messages: [
    //     {
    //       to: `${phone_num}`,
    //       from: "01087128235",
    //       subject: `출고증`,
    //       imageId: fileId,
    //       text: `QR 코드를 스캔하여 출고증 인쇄하십시오.`,
    //     },
    //   ],
    // });

    // d. if(!err) => delete saved file and commit chages 
    // if (result) {
    return true
    // }
  } catch (err) {
    next(err)
    return false
  } finally {
    fs.unlinkSync(`${__dirname}/qr_imgs/${transaction_id}.jpeg`);
  }
}
module.exports = sendQr