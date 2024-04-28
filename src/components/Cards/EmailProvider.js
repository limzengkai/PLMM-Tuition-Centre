// import React from "react";
// import Mailgun from 'mailgun.js';

// function EmailProvider() {
//     // const mailgun = new Mailgun(formData);
//     const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere'});
//     const sendEmail = () => {
//     // Initialize Mailgun SDK with your API key and domain
//     const mg = mailgun({
//       apiKey: "4b670513-51cb72e1",
//       domain: "https://app.mailgun.com/app/sending/domains/sandbox1676e2cd3c3147568e5b2eb81303f3b4.mailgun.org",
//     });

//     // Define email data
//     const data = {
//       from: "limzengkai00@gmail.com",
//       to: "RECIPIENT_EMAIL_ADDRESS",
//       subject: "Test Email",
//       text: "This is a test email sent from Mailgun!",
//     };

//     // Send the email
//     mg.messages().send(data, (error, body) => {
//       if (error) {
//         console.error("Error sending email:", error);
//       } else {
//         console.log("Email sent successfully:", body);
//       }
//     });
//   };

//   return (
//     <div>
//       <button onClick={sendEmail}>Send Email</button>
//     </div>
//   );
// }

// export default EmailProvider;
