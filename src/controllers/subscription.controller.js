const mongoose = require("mongoose");
const { isValidObjectId } = mongoose;
const { User } = require("../models/user.model.js");
const { Subscription } = require("../models/subscription.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid object id");
  }

  const subscriber = req.user._id;
  const channel = channelId;
  const subscribed = await Subscription.findOne({
    $and: [{ subscriber: subscriber }, { channel: channel }],
  });

  if (subscribed) {
    await Subscription.findOneAndDelete({ subscriber, channel });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  } else {
    const subscription = await Subscription.create({ subscriber, channel });
    return res
      .status(200)
      .json(new ApiResponse(200, subscription, "Subscribed successfully"));
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid channel");
  }

  const subscriber = await Subscription.find({
    channel: subscriberId,
  }).populate("subscriber", "username fullName avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriber,
        "Channel subscribers fetched successfully"
      )
    );
});
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = channelId;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id");
  }

  const subscriptions = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "username fullName avatar");

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscriptions, "Subscriptions fetched successfully")
    );
});

module.exports = {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
};
