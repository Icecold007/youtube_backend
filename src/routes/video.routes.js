const { Router } = require("express");
const {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishedStatus,
  updateVideo,
} = require("../controllers/video.controller.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");
const { upload } = require("../middlewares/multer.middleware.js");

const router = Router();
router.use(verifyJWT);
router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishedStatus);

module.exports = router;
