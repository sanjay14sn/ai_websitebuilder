import nodemailer from 'nodemailer';

async function testAuth(email) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: 'skffcrirzizrhjyo'
    }
  });

  return new Promise((resolve) => {
    transporter.verify(function (error, success) {
      if (error) {
        console.log(`Failed for ${email}:`, error.message);
        resolve(false);
      } else {
        console.log(`SUCCESS for ${email}!`);
        resolve(true);
      }
    });
  });
}

async function main() {
  await testAuth('gripbusinessforum@gmail.com');
  await testAuth('gripbusiness2025@gmail.com');
  await testAuth('snsanjay2002@gmail.com');
}

main();
