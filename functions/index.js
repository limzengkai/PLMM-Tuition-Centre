const express = require("express");
const cors = require("cors");

// Initialize the Express app
const app = express();
// Allow cross-origin requests
app.use(cors({ origin: true }));

// Import the Cloud Functions
const { processRegistration } = require("./myfunctions/processRegistration");
const { deleteUserFromAuth } = require("./myfunctions/deleteUserFromAuth");
const { getUserFromAuth } = require("./myfunctions/getUserData");
const { feePaymentReminder } = require("./myfunctions/feePaymentReminder");
const { checkUserState} = require("./myfunctions/checkUserState");
const { updateUserStatus } = require("./myfunctions/updateUserStatus");
const { notifyAdminsOnRegistration } = require("./myfunctions/notifyAdminsOnRegistration");
const { feeGeneration } = require("./myfunctions/feeGeneration");
const { checkVoucherExpired } = require("./myfunctions/checkVoucherExpired");
const { publishMonthlyFees } = require("./myfunctions/publishMonthlyFees");

// Export the Cloud Functions
exports.notifyAdminsOnRegistration = notifyAdminsOnRegistration;
exports.processRegistration = processRegistration;
exports.deleteUserFromAuth = deleteUserFromAuth;
exports.getUserFromAuth = getUserFromAuth;
exports.feePaymentReminder = feePaymentReminder;
exports.checkUserState = checkUserState;
exports.updateUserStatus = updateUserStatus;
exports.feeGeneration = feeGeneration;
exports.checkVoucherExpired = checkVoucherExpired;
exports.publishMonthlyFees = publishMonthlyFees;