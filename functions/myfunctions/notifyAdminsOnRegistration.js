const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.notifyAdminsOnRegistration = functions.firestore
  .document('registration/{registrationId}')
  .onCreate(async (snap, context) => {
    const newParentData = snap.data();
    const { firstName, lastName } = newParentData;

    try {
      // Fetch all admin users
      const usersSnapshot = await db.collection('users').where('role', '==', 'admin').get();
      
      if (usersSnapshot.empty) {
        console.log('No admin users found');
        return null;
      }

      // Prepare notification data
      const notificationPromises = [];
      usersSnapshot.forEach(doc => {
        const adminId = doc.id;
        const notificationData = {
          title: 'New Parent Registration',
          message: `A new parent named ${firstName} ${lastName} has registered and requires action.`,
          isRead: false,
          userId: adminId,
          AddTime: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add notification to the notifications collection
        const notificationPromise = db.collection('notifications').add(notificationData);
        notificationPromises.push(notificationPromise);
      });

      // Wait for all notifications to be added
      await Promise.all(notificationPromises);
      console.log('Notifications sent to all admins');
      return null;
    } catch (error) {
      console.error('Error notifying admins: ', error);
      throw new functions.https.HttpsError('unknown', 'Error notifying admins', error);
    }
  });
