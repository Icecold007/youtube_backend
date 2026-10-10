const mongoose = require("mongoose");
const { isValidObjectId } = mongoose;
const { Video } = require("../models/video.model.js");
const { User } = require("../models/user.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { asyncHandler } = require("../utils/asyncHandler.js");
const {
  uploadOnCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary.js");
const { deleteTweet } = require("./tweet.controller.js");

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pipeline = [];

  const matchStage = {};

  if (query) {
    matchStage.$or = [
      { title: { $regrex: query, $options: "i" } },
      { description: { $regrex: query, $options: "i" } },
    ];
  }

  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  matchStage.isPublished = true;

  pipeline.push({ $match: matchStage });

  if (sortBy) {
    const sort = {};
    sort[sortBy] = sortType === "asc" ? 1 : -1;
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$ownerDetails",
    }
  );

  const videoAggregate = Video.aggregate(pipeline);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  const result = await Video.aggregatePaginate(videoAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if ([title, description].some((field) => !field || field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  const [video, thumbnail] = await Promise.all([
    uploadOnCloudinary(videoLocalPath),
    uploadOnCloudinary(thumbnailLocalPath),
  ]);

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is missing");
  }

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is missing");
  }

  if (!video) {
    throw new ApiError(400, "Error while uploading video");
  }

  if (!thumbnail) {
    throw new ApiError(400, "Error while uploading thumbnai");
  }

  const owner = req.user._id;

  const vid = await Video.create({
    videoFile: video.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: video.duration,
    owner: owner,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, vid, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (videoId) {
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video Id");
    }
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username avatar fullName"
  );

  await Video.findByIdAndUpdate(videoId, {
    $inc: { views: 1 },
  });

  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { watchHistory: videoId },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }

  updateFields = {};

  if (title) updatedFields.title = title;
  if (description) updatedFields.description = description;

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updatedFields,
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "unauthorized access");
  }
  await deleteFromCloudinary(video.videoFile, "video");
  await deleteFromCloudinary(video.thumbnail);

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishedStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "unauthorized access");
  }
  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video ${video.isPublished ? "Published" : "Unpublished"} Successfully`
      )
    );
});

module.exports = {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishedStatus,
};
