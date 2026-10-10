const mongoose = require("mongoose");
const { Video } = require("../models/video.model.js");
const { Subscription } = require("../models/subscription.model.js");
const { Like } = require("../models/like.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse, asyncHandler } = require("../utils/asyncHandler.js");

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized access");
  }

  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });

  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$viewws" },
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
  ]);

  const stats = videoStats[0] || {
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
  };

  const channelStats = {
    totalSubscribers,
    totalVideos: stats.totalVideos,
    totalViews: stats.totalViews,
    totalLikes: stats.totalLikes,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Generated channel stats"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized access");
  }
  const videos = (await Video.find({ owner: userId })).toSorted({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Fetched videos of channel"));
});

module.exports = {
  getChannelStats,
  getChannelVideos,
};
