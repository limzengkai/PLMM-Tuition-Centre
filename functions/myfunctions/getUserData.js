const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Cloud Function to get user Data
exports.getUserFromAuth = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;

    try {
      const userRecord = await admin.auth().getUser(userId);
      console.log('Successfully fetched user data:', userRecord.toJSON());
      // Here you can access user authentication information such as userRecord.disabled
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  });

module.exports = exports;