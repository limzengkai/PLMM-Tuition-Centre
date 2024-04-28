const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.deleteUserFromAuth = functions.firestore
  .document('users/{userId}')
  .onDelete(async (snap, context) => {
    const deletedUserId = context.params.userId;

    try {
      await admin.auth().deleteUser(deletedUserId);
      console.log(`Successfully deleted user with ID: ${deletedUserId} from Authentication`);
    } catch (error) {
      console.error(`Error deleting user with ID: ${deletedUserId} from Authentication`, error);
    }
  });

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

        console.log("Email:", emailVerificationLink);
        // Return the user's UID, generated password, and email verification link
        return {
            userCredential: userCredential,
            generatedPassword: generatedPassword,
            emailVerificationLink: emailVerificationLink
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