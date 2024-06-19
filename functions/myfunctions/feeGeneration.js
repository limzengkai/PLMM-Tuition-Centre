const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.feeGeneration = functions.pubsub
  .schedule("00 00 20 * *") // Run the function at 00:00 on the 20th of every month
  .timeZone("Asia/Kuala_Lumpur") // Set timezone to Kuala Lumpur, Malaysia
  .onRun(async (context) => {
    try {
      const studentsSnapshot = await admin.firestore().collection("students").get();
      const students = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStart = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10);

      for (const student of students) {
        if (student.registeredCourses && student.registeredCourses.length > 0) {
          for (const courseId of student.registeredCourses) {
            const feesSnapshot = await admin.firestore()
              .collection("fees")
              .where("DueDate", "==", nextMonthStart)
              .where("StudentID", "==", student.id)
              .where("CourseID", "==", courseId)
              .get();

            if (feesSnapshot.empty) {
              await generateFeesForStudent(student.id, courseId, nextMonthStart);
            }
          }
        }
      }

      // Fetch admin emails and send notification
      const adminSnapshot = await admin.firestore().collection("users").where("role", "==", "admin").get();
      const adminEmails = adminSnapshot.docs.map((doc) => doc.data().email);
      const adminIds = adminSnapshot.docs.map((doc) => doc.id); // Collect admin IDs

      const emailBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fee Generation Notification</title>
      </head>
      <body>
        <p>Dear Admin,</p>
        <p>Fees for the next month have been successfully generated for all students.</p>
        <p>Please check the fees and you can publish the fee as you need.</p>
        <p>Thank you.</p>
      </body>
      </html>
      `;

      const emailPromises = adminEmails.map((adminEmail) =>
        admin.firestore().collection("mail").add({
          to: adminEmail,
          message: {
            subject: "Fee Generation Notification",
            html: emailBody,
          },
        })
      );

      // Add notifications to admin users
      const notificationPromises = adminIds.map((adminId) =>
        admin.firestore().collection("notifications").add({
          title: "Fee Generation Notification",
          message: "Fees for the next month have been generated for all students.",
          isRead: false,
          userId: adminId,
          AddTime: admin.firestore.FieldValue.serverTimestamp(),
        })
      );

      // Wait for all emails and notifications to be sent
      await Promise.all([...emailPromises, ...notificationPromises]);

      console.log("Fees generated and notification emails sent.");
      return null;
    } catch (error) {
      console.error("Error generating fees for next month:", error);
      return null;
    }
  });

async function generateFeesForStudent(studentId, courseId, nextMonthStartTimestamp) {
  try {
    const studentDocRef = admin.firestore().collection("students").doc(studentId);
    const studentDocSnapshot = await studentDocRef.get();
    if (!studentDocSnapshot.exists) {
      throw new Error("Student not found.");
    }

    const newDocRef = await admin.firestore().collection("fees").add({
      DueDate: nextMonthStartTimestamp,
      StudentID: studentId,
      CourseID: courseId,
      paidAmount: 0,
      paymentDate: null,
      paymentStatus: false,
      publish: false,
      isDiscount: false,
      DiscountID: null,
    });

    const courseDocRef = admin.firestore().collection("class").doc(courseId);
    const courseDocSnapshot = await courseDocRef.get();
    if (courseDocSnapshot.exists) {
      const courseData = courseDocSnapshot.data();
      const feeAmount = courseData.fee;

      const classesData = [
        {
          Description: `Fee for ${courseData.CourseName}`,
          FeeAmount: feeAmount,
        },
      ];
      const descriptions = classesData.map((item) => item.Description);
      const feeAmounts = classesData.map((item) => Number(item.FeeAmount));
      const quantity = [1];

      await admin.firestore().collection("fees").doc(newDocRef.id).collection("Classes").add({
        ClassId: courseId,
        Descriptions: descriptions,
        FeeAmounts: feeAmounts,
        Quantity: quantity,
      });
    } else {
      console.log(`Course with ID ${courseId} does not exist.`);
    }
  } catch (error) {
    console.error(`Error generating fees for student ${studentId}:`, error);
    throw error;
  }
}

module.exports = exports;
