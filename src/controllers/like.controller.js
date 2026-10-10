const mongoose = require("mongoose");
const { isValidObjectId } = mongoose;
const { Like } = require("../models/like.model.js");
const { Video } = require("../models/video.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const { Comment } = require("../models/comment.model.js");
const { Tweet } = require("../models/tweet.model.js");

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const likedBy = req.user._id;
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.fingOne({ likedBy, video: videoId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new ApiResponse(200, {}, "Removed video Like"));
  } else {
    const newLike = await Like.create({ likedBy, video: videoId });
    return res.status(200).json(new ApiResponse(200, newLike, "Liked video"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment Id");
  }

  const likedBy = req.user._id;
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({ likedBy, comment: commentId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Removed comment like"));
  } else {
    const newLike = await Like.create({ likedBy, comment: commentId });
    return res.status(200).json(new ApiResponse(200, newLike, "Liked comment"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const likedBy = req.user._id;
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweets not found");
  }

  const existingLike = await Like.findOne({ likedBy, tweet: tweetId });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res.status(200).json(new ApiResponse(200, {}, "Removed tweet like"));
  } else {
    const newLike = await Like.create({ likedBy, tweet: tweetId });
    return res.status(200).json(new ApiResponse(200, newLike, "Liked tweet"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localFields: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    { $unwind: "$video" },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Fetched liked videos"));
});

module.exports = {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
};
