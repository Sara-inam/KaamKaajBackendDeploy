const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sarainam60@gmail.com",
    pass: "viczqmnwycjkbnzg",
  },
});

async function test() {
  try {
    await transporter.verify();
    console.log("✅ Email credentials are correct.");
  } catch (err) {
    console.log("❌ Error:");
    console.log(err.message);
  }
}

test();