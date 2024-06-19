const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Firebase Cloud Function triggered on the 15th of every month
exports.feePaymentReminder = functions.pubsub
  .schedule("00 20 15 * *") // Run on the 15th of every month at 8:00 AM
  .timeZone("Asia/Kuala_Lumpur") // Set timezone to Kuala Lumpur, Malaysia
  .onRun(async (context) => {
    try {
      //================================================================================================
      // Query fees that are not paid
      const feesRef = admin.firestore().collection("fees");
      const snapshot = await feesRef.where("paymentStatus", "==", false).get();

      // Log data
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // =================================================================================================
      // Filter fees where the due date has passed
      const overdueFees = data.filter((item) => {
        const dueDate = item.DueDate.toDate(); // Convert Firebase Timestamp to JavaScript Date
        const currentDate = new Date();
        return dueDate < currentDate;
      });

      // =================================================================================================
      // Fetch student data for overdue fees
      await Promise.all(
        overdueFees.map(async (fee) => {
          try {
            const studentRef = await admin
              .firestore()
              .collection("students")
              .doc(fee.StudentID)
              .get();
            const studentData = studentRef.data();
            if (studentData) {
              const studentName =
                studentData.firstName + " " + studentData.lastName;
              fee.StudentName = studentName;
            } else {
              console.log("Student data not found for ID: ", fee.StudentID);
            }
          } catch (error) {
            console.error("Error fetching student data:", error);
          }
        })
      );

      // =================================================================================================
      // Fetch class data for overdue fees
      await Promise.all(
        overdueFees.map(async (fee) => {
          try {
            const classesRef = await admin
              .firestore()
              .collection("fees")
              .doc(fee.id)
              .collection("Classes")
              .get();
            const classesData = classesRef.docs.map((doc) => doc.data());
            fee.Classes = classesData;
          } catch (error) {
            console.error("Error fetching class data:", error);
          }
        })
      );

      console.log("Overdue Fees:", overdueFees);
      console.log("Classes", overdueFees[0].Classes);

      // =================================================================================================
      // Send reminder emails for overdue fees
      await Promise.all(
        overdueFees.map(async (fee) => {
          try {
            const ParentSnapshot = await admin
              .firestore()
              .collection("parent")
              .where("children", "array-contains", fee.StudentID)
              .get();
            const parentId = ParentSnapshot.docs.map((doc) => doc.id)[0];
            const parentDetails = await admin
              .firestore()
              .collection("users")
              .doc(parentId)
              .get();
            const email = parentDetails.data().email;
            const emailBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Fee Payment Reminder</title>
              <style>
                /* Reset CSS */
                body, html {
                  margin: 0;
                  padding: 0;
                  font-family: Arial, sans-serif;
                }
                /* Table CSS */
                .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  border: 1px solid #ccc;
                  border-radius: 10px;
                }
                .table {
                  margin-top: 5px;
                  width: 100%;
                  background-color: transparent;
                  border-collapse: collapse;
                }
                .table th,
                .table td {
                  padding: 0.75rem;
                  text-align: left;
                  vertical-align: middle;
                  border: 1px solid #e2e8f0;
                }
                .table th {
                  font-size: 0.75rem;
                  text-transform: uppercase;
                  font-weight: 600;
                }
                .table td {
                  font-size: 0.875rem;
                }
                .font-bold {
                  font-weight: 700;
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header">
                  <h1>Fee Payment Reminder</h1>
                </div>
                <div class="body">
                  <p>Dear Parent,</p>
                  <p>This is a reminder that the fee payment for your child is due. Please ensure that the payment is made promptly to avoid any inconvenience.</p>
                  <p>Student Name: ${fee.StudentName}</p>
                  <p>Payment Due Date: ${formatDate(fee.DueDate)}</p>
                  <p>Below is your payment details</p>
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Item / Description</th>
                        <th>Fee</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${fee.Classes.map(
                        (Classfee) => `
                        <tr key="${Classfee.ClassId}">
                          ${Classfee.Descriptions.map(
                            (description, index) => `
                            <td key="${index}">
                              ${
                                description.length > 60
                                  ? description.substring(0, 60) + "..."
                                  : description
                              }
                            </td>
                          `
                          ).join("")}
                          ${Classfee.FeeAmounts.map(
                            (fee, index) => `
                            <td key="${index}">RM ${parseFloat(fee).toFixed(
                              2
                            )}</td>
                          `
                          ).join("")}
                          ${Classfee.Quantity.map(
                            (quantity, index) => `
                            <td key="${index}">${quantity}</td>
                          `
                          ).join("")}
                          ${Classfee.FeeAmounts.map(
                            (feeAmount, index) => `
                            <td key="${index}">RM ${(
                              parseFloat(feeAmount) *
                              parseFloat(Classfee.Quantity[index])
                            ).toFixed(2)}</td>
                          `
                          ).join("")}
                        </tr>
                      `
                      ).join("")}
                      <tr>
                        <td></td>
                        <td></td>
                        <td class="font-bold">Total</td>
                        <td class="font-bold">RM ${fee.Classes.reduce(
                          (acc, curr) => {
                            const totalClassFee = curr.FeeAmounts.reduce(
                              (subAcc, subCurr) => subAcc + parseFloat(subCurr),
                              0
                            );
                            return acc + totalClassFee;
                          },
                          0
                        ).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p>Thank you for your cooperation.</p>
                </div>
                <div class="footer">
                  <p>This is an automated email. Please do not reply.</p>
                </div>
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
                  subject: "Fee Payment Reminder",
                  html: emailBody,
                },
              });
          } catch (error) {
            console.error("Error sending reminder email:", error);
          }
        })
      );

      // =================================================================================================
      // Fetch all admin users
      const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("role", "==", "admin")
        .get();

      if (usersSnapshot.empty) {
        console.log("No admin users found");
        return null;
      }

      // Prepare and add notification data for admins
      const notificationPromises = [];
      usersSnapshot.forEach((doc) => {
        const adminId = doc.id;
        const notificationData = {
          title: "Fee Payment Reminder",
          message: `A fee payment reminder has been sent to each parent.`,
          isRead: false,
          userId: adminId,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add notification to the notifications collection
        const notificationPromise = admin
          .firestore()
          .collection("notifications")
          .add(notificationData);
        notificationPromises.push(notificationPromise);
      });

      // Wait for all notifications to be added
      await Promise.all(notificationPromises);

      console.log("Notifications sent to all admins");
      return null;
    } catch (error) {
      console.error("Error sending payment reminders:", error);
      return null;
    }
  });

function formatDate(timestamp) {
  // Check if the timestamp is in seconds or milliseconds
  const seconds = timestamp._seconds || Math.floor(timestamp / 1000);

  // Create a new Date object from the timestamp in UTC
  const date = new Date(seconds * 1000);

  // Adjust the date to the GMT+08:00 time zone
  const timezoneOffset = 8 * 60 * 60 * 1000; // Offset for GMT+08:00 in milliseconds
  const localDate = new Date(date.getTime() + timezoneOffset);

  // Get the year, month, and day from the adjusted date object
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0"); // Month starts from 0
  const day = String(localDate.getDate()).padStart(2, "0");

  // Concatenate the year, month, and day with slashes
  const formattedDate = `${year}/${month}/${day}`;

  // Return the formatted date
  return formattedDate;
}

module.exports = exports;
