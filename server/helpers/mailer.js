const logger = require('../../config/logger');
const AWS = require('aws-sdk');

/* const DOMAIN = 'sandbox23e4bb0a9391421c85d04d078a56fd83.mailgun.org';
const DOMAIN = "sandbox8f28ca251b384140b68a9fe9b4048603.mailgun.org";
const mg = mailgun({apiKey: '58afb2de5cb59853bc1327478041da74-1f1bd6a9-75932d84', domain: DOMAIN});
const mg = mailgun({apiKey: "51b55b04e8d9c61947d4c13c9c19b2b4-443ec20e-73e0afed", domain: DOMAIN}); */

AWS.config.loadFromPath('./config/aws-ses/aws-ses-config.json');

let sendConfirmationEmail = (orderData)=>{
    let htmlData;

    if(orderData.orderStatus == 'ACCEPTED')
    {
        htmlData = `<h1>Hi ${orderData.userDetails.firstName},</h1>
        <br>
        <p>Thank you for using Food Inventory!</p>
        <br>
        <p>Your order #${orderData.orderNumber} has been accepted. Hope to see you order again soon.</p>
        <br><br>
        <p>Total Amoount- &#163;${orderData.totalAmount}</p>`
    }
    else
    {
        htmlData = `<h1>Hi ${orderData.userDetails.firstName},</h1>
        <br>
        <p>Thank you for using Food Inventory!</p>
        <br>
        <p>Your order #${orderData.orderNumber} has declined. We apologise for this experience
        and hope to see you order again soon.</p>
        <br><br><br>
        <p>If you have any queries please contact,</p>
        <p>https://namasteindia-de.herokuapp.com</p>
        <br><br>
        <p>Total Refund- &#163;${orderData.totalAmount}</p>`
    }

    const email = {
        Destination: {
            ToAddresses: [orderData.userDetails.email]
        },
        Message: {
            Body: {
                Html: {Data: htmlData}
            },
            Subject: {Data: (orderData.orderStatus == 'ACCEPTED') ? 'Order Accepted' : 'Order Declined'}
        },
        Source: 'dev.foodinventory@gmail.com'
    }

    const mailPromise = new AWS.SES().sendEmail(email).promise();
    mailPromise.then((data) => {
        logger.info('On Fulfilled ', data);
    })
    .catch((err) => {
        logger.info('On Reject ', err);
    });

}

module.exports = {
    sendConfirmationEmail
}