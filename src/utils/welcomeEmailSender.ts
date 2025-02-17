import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log('Email server is ready to take request: ', success);
});

const mailOptions = {
  from: `"ME" ${process.env.SMTP_USER}`,
  to: '',
  subject: 'Welcome to File Manager',
  text: '',
  html: ``,
  attachments: [{}],
};

async function sendEmails(recipients: string | string[]): Promise<void> {
  if (Array.isArray(recipients)) {
    for (const recipient of recipients) {
      const options = {
        ...mailOptions,
        to: recipient,
      };
      try {
        const info = await transporter.sendMail(options);
        console.log('Message sent: %s', info.messageId);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }
  } else {
    const options = {
      ...mailOptions,
      to: recipients,
    };
    try {
      const info = await transporter.sendMail(options);
      console.log('Message sent: %s', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}
