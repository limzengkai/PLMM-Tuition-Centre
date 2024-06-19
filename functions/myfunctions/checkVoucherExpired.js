const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.checkVoucherExpired = functions.pubsub
  .schedule("00 00 * * *") // Run the function at 00:00 every day
  .timeZone("Asia/Kuala_Lumpur") // Set timezone to Kuala Lumpur, Malaysia
  .onRun(async (context) => {
    try {
      const currentDate = new Date();
      const vouchersSnapshot = await admin
        .firestore()
        .collection("vouchers")
        .get();

      const updatePromises = vouchersSnapshot.docs.map(async (voucherDoc) => {
        const voucherData = voucherDoc.data();
        const expiryDate = new Date(voucherData.expiryDate);

        if (currentDate >= expiryDate) {
          const voucherRef = voucherDoc.ref;
          return voucherRef.update({ status: "expired" });
        }
      });

      await Promise.all(updatePromises);
      console.log("Vouchers checked and updated successfully.");
    } catch (error) {
      console.error("Error processing vouchers:", error);
      throw new functions.https.HttpsError(
        "internal",
        "An error occurred",
        error
      );
    }
  });
