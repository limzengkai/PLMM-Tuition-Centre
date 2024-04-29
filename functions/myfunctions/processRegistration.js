const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Cloud Function to process registration
exports.processRegistration = functions.https.onCall(async (data, context) => {
  try {
      console.log('Processing registration:', data);
      const registration = data.registration;
      const generatedPassword = generateRandomPassword(12);

      // Create the user in Firebase Authentication
      const userCredential = await admin.auth().createUser({
          email: registration.email,
          password: generatedPassword,
      });

      // Generate email verification link with redirect URL
      const actionCodeSettings = {
          url: 'http://localhost:3000/auth/login', // Redirect URL after email verification
          handleCodeInApp: true, // Handle the email verification in the app
      };
      const emailVerificationLink = await admin.auth().generateEmailVerificationLink(registration.email, actionCodeSettings);

      // Save user data to Firestore
      await admin.firestore().collection('users').doc(userCredential.uid).set({
          email: registration.email,
          firstName: registration.firstName,
          lastName: registration.lastName,
          contactNumber: registration.contactNumber,
          address: registration.address,
          postcode: registration.postcode,
          city: registration.city,
          state: registration.state,
          birthDate: registration.birthDate,
          role: registration.role,
          registrationDate: new Date(),
      });

      // Send the first email to the user
      await sendFirstEmail(registration.email, generatedPassword, emailVerificationLink);

      console.log("Processing registration completed successfully.");

      // Return the user's UID, generated password, and email verification link
      return {
          userCredential: userCredential.uid
      };
  } catch (error) {
      console.error('Error processing registration:', error);
      return { error: error.message };
  }
});

function generateRandomPassword(length) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

// Define a function to send the first email
async function sendFirstEmail(email, generatedPassword, emailVerificationLink) {
    try {
        const loginLink = `http://localhost:3000/auth/login`;
        const emailBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Verification</title>
            <style>
                /* Your CSS styles here */
            </style>
        </head>
        <body>
            <div class="container">
                <h2 class="title">Welcome!</h2>
                <p class="message">Your account has been successfully created.</p>
                <p class="message">To get started, please follow these steps:</p>
                <ol class="steps">
                    <li>Before logging in, please verify your account by clicking the button below:</li>
                    <a href="${emailVerificationLink}" class="button">Verify Account</a>
                    <li>After verifying your account, you can log in by clicking the button below:</li>
                    <a href="${loginLink}" class="button">Login</a>
                    <li>Use the following default password for logging in:</li>
                    <p>${generatedPassword}</p>
                    <li>Finally, remember to change your password for security reasons.</li>
                </ol>
                <p class="message">Thank you for choosing our service!</p>
            </div>
        </body>
        </html>
        `;
  
        // Send email to the user
        await admin.firestore().collection('mail').add({
            to: email,
            message: {
                subject: "Welcome to PLMM Tuition Centre",
                html: emailBody,
            },
        });
        console.log("First email sent successfully to:", email);
    } catch (error) {
        console.error('Error sending first email:', error);
        throw error; // Throw the error for handling in the calling function
    }
  }
  

module.exports = exports;