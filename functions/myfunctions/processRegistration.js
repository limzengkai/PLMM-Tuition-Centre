const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Cloud Function to process registration
exports.processRegistration = functions.https.onCall(async (data, context) => {
  try {
    const registration = data.registration;
    const generatedPassword = generateRandomPassword(12);
    // Create the user in Firebase Authentication
    const userCredential = await admin.auth().createUser({
      email: registration.email,
      password: generatedPassword,
    });

    // Generate email verification link with redirect URL
    const actionCodeSettings = {
      url: "http://localhost:3000/auth/login", // Redirect URL after email verification
      handleCodeInApp: true, // Handle the email verification in the app
    };
    const emailVerificationLink = await admin
      .auth()
      .generateEmailVerificationLink(registration.email, actionCodeSettings);

    // Save user data to Firestore
    await admin.firestore().collection("users").doc(userCredential.uid).set({
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
    await sendFirstEmail(
      registration.email,
      generatedPassword,
      emailVerificationLink
    );

    // Return the user's UID, generated password, and email verification link
    return {
      userCredential: userCredential.uid,
    };
  } catch (error) {
    console.error("Error processing registration:", error);
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
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                }
                .container {
                    max-width: 600px;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    padding: 20px;
                    text-align: center;
                }
                h1 {
                    color: #333;
                    margin-bottom: 20px;
                }
                p {
                    color: #666;
                    margin-bottom: 20px;
                }
                .password {
                    font-size: 18px;
                    font-weight: bold;
                    color: #007bff;
                }
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    margin: 10px 0;
                    font-size: 16px;
                    color: #fff;
                    background-color: #007bff;
                    text-decoration: none;
                    border-radius: 5px;
                }
                .button:hover {
                    background-color: #0056b3;
                }
                ol {
                    text-align: left;
                    margin: 0 auto;
                    display: inline-block;
                    text-align: left;
                    padding-left: 0;
                }
                li {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome to PLMM Tuition Centre!</h1>
                <p>Your account has been successfully created. To get started, please follow these steps:</p>
                <ol>
                    <li>
                        Before logging in, please verify your account by clicking the button below:
                        <br>
                        <a href="${emailVerificationLink}" class="button">Verify Account</a>
                    </li>
                    <li>
                        After verifying your account, you can log in by clicking the button below:
                        <br>
                        <a href="${loginLink}" class="button">Login</a>
                    </li>
                    <li>
                        Use the following default password for logging in:
                        <br>
                        <span class="password">${generatedPassword}</span>
                    </li>
                    <li>Finally, remember to change your password for security reasons.</li>
                </ol>
                <p>Thank you for choosing our service!</p>
            </div>
        </body>
        </html>
        `;

    // Send email to the user
    await admin
      .firestore()
      .collection("mail")
      .add({
        to: email,
        message: {
          subject: "Welcome to PLMM Tuition Centre",
          html: emailBody,
        },
      });
    console.log("First email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending first email:", error);
    throw error; // Throw the error for handling in the calling function
  }
}

module.exports = exports;
