// const serverless = require('serverless-http');
// const app = require('../index'); // Import the Express app

// module.exports = serverless(app); // Export for Vercel


import serverless from "serverless-http";
import appInstance from "../index.js"

export const app = serverless(appInstance);
