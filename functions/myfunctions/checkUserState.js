const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.checkUserState = functions.https.onCall(async (data, context) => {
  try {
    const { uid } = data; // Extract UID from the data passed
    const userRecord = await admin.auth().getUser(uid);
    return userRecord.disabled;

  } catch (error) {
    console.error('Error processing registration:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred', error);
  }
});
