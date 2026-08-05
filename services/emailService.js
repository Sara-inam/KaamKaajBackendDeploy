const transporter = require("../config/nodemailer");


exports.sendEmail = async(
    to,
    subject,
    html
)=>{


await transporter.sendMail({

from:process.env.EMAIL_USER,

to,

subject,

html

});


};