const mongoose = require("mongoose");
const { isValidObjectId } = mongoose;
const { Tweet } = require("../models/tweet.model.js");
const { User } = require("../models/user.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Tweet content not found");
  }
  const owner = req.user._id;

  const tweet = await Tweet.create({
    content: content,
    owner: owner,
  });
  return res
    .status(200)
    .json(new ApiResponse(201, tweet, "Tweet created successfully!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User not found");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content.trim()) {
    throw new ApiError(400, "No content found for changes");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Unauthorized access");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: content,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully."));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.body;

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(400, "Tweet not found");
  }

  if (tweet.owner.toString() !== user._id.toString()) {
    throw new ApiError(401, "Unauthorized Access");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  return res.status(200).json(200, deletedTweet, "Tweet deleted successfully.");
});

module.exports = {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
};
