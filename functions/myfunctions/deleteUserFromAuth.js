const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Cloud Function to delete user from Authentication
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

module.exports = exports;