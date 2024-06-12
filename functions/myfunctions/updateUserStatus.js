const functions = require("firebase-functions");
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.updateUserStatus = functions.https.onCall(async (data, context) => {
  try {
    console.log("Updating user status...");
    // Check if the request is authenticated
    // if (!context.auth) {
    //   throw new functions.https.HttpsError(
    //     "unauthenticated",
    //     "You must be authenticated to update user status."
    //   );
    // } else if (!context.auth.role !== "admin") {
    //   throw new functions.https.HttpsError(
    //     "permission-denied",
    //     "You must have administrative privileges to update user status."
    //   );
    // }

    // Extract userId from the data
    const { userId } = data;
    // Get the current user data
    const userRecord = await admin.auth().getUser(userId);
    // Toggle user's status
    const newDisabledStatus = !userRecord.disabled;
    // Update the user's status in the database
    await admin.auth().updateUser(userId, { disabled: newDisabledStatus });
    // Return success message and the updated user status
    return { success: true, disabled: newDisabledStatus };
  } catch (error) {
    console.error("Error updating user status:", error);
    // Return error message
    throw new functions.https.HttpsError(
      "internal",
      "Failed to update user status."
    );
  }
});

module.exports = exports;