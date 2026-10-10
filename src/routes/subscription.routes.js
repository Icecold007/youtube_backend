const { Router } = require("express");
const {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} = require("../controllers/subscription.controller.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const router = Router();

router.use(verifyJWT);

router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/u/:subscribedId").get(getUserChannelSubscribers);

module.exports = router;
