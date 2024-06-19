const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

exports.publishMonthlyFees = functions.pubsub
  .schedule("00 00 * * *") // Run the function at 00:00 every day
  .timeZone("Asia/Kuala_Lumpur") // Set timezone to Kuala Lumpur, Malaysia
  .onRun(async (context) => {
    try {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const currentMonthName = monthNames[currentMonth];

      // Fetch all fees
      const feeSnapshot = await db.collection("fees").get();
      const notifications = [];
      const emails = [];

      for (const feeDoc of feeSnapshot.docs) {
        const feeData = feeDoc.data();
        const dueDate = feeData.DueDate.toDate();

        if (
          dueDate.getMonth() === currentMonth &&
          dueDate.getFullYear() === currentYear &&
          !feeData.publish
        ) {
          // Update the fee document to mark it as published
          await db.collection("fees").doc(feeDoc.id).update({ publish: true });

          // Fetch student to get parentId
          const studentDoc = await db
            .collection("students")
            .doc(feeData.StudentID)
            .get();
          const parentId = studentDoc.data().parentId;

          // Fetch parent to get email
          const parentDoc = await admin.auth().getUser(parentId);
          const parentEmail = parentDoc.email;

          // Prepare notification for parent
          const notificationData = {
            title: "Fee Published",
            message: `The fee for ${currentMonthName} has been published.`,
            isRead: false,
            userId: parentId,
            AddTime: admin.firestore.FieldValue.serverTimestamp(),
          };

          notifications.push(
            db.collection("notifications").add(notificationData)
          );

          // Prepare email content
          const emailBody = `
            <div style="font-family: Arial, sans-serif; font-size: 16px;">
              <p>Dear Parent,</p>
              <p>The fee for <strong>${currentMonthName}</strong> has been published.</p>
              <p>Please log in to the system to view and make payment.</p>
              <p>Thank you.</p>
              <p>Best regards,</p>
              <p>Your School</p>
            </div>
          `;

          // Send email to the parent
          emails.push(
            db.collection("mail").add({
              to: parentEmail,
              message: {
                subject: "Fee Payment Reminder",
                html: emailBody,
              },
            })
          );
        }
      }

      // Send a notification to notify admins

      // Fetch all admin users
      const usersSnapshot = await db
        .collection("users")
        .where("role", "==", "admin")
        .get();

      if (usersSnapshot.empty) {
        console.log("No admin users found");
        return null;
      }

      // Prepare notification data
      const notificationPromises = [];

      usersSnapshot.forEach((doc) => {
        const adminId = doc.id;

        const notificationData = {
          title: "Monthly Fees Published",
          message: `The monthly fees for ${currentMonthName} have been published.`,
          isRead: false,
          userId: adminId,
          AddTime: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add notification to the notifications collection
        const notificationPromise = db
          .collection("notifications")
          .add(notificationData);
        notificationPromises.push(notificationPromise);
      });

      await Promise.all([...notifications, ...emails]);

      console.log(
        "Fees published, notifications sent, and emails added to mail collection."
      );
    } catch (error) {
      console.error("Error publishing fees:", error);
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred",
        error
      );
    }
  });
