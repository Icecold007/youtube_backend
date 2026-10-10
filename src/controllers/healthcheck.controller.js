const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");

const healthcheck = asyncHandler(async (req, res) => {
  return res.status(200).json(200, { status: "OK" }, "Health check passed");
});

module.exports = { healthcheck };
