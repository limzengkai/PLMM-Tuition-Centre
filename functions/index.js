const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({ origin: true }));

// Import processRegistration function from myfunctions/processRegistration.js
const { processRegistration } = require("./myfunctions/processRegistration");

// Import deleteUserFromAuth function from myfunctions/deleteUserFromAuth.js
const { deleteUserFromAuth } = require("./myfunctions/deleteUserFromAuth");

const { getUserFromAuth } = require("./myfunctions/getUserData");

// Export the Cloud Functions
exports.processRegistration = processRegistration;
exports.deleteUserFromAuth = deleteUserFromAuth;
exports.getUserFromAuth = getUserFromAuth;
