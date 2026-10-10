const { Router } = require("express");
const {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoPlaylist,
  updatedPlaylist,
} = require("../controllers/playlist.controller.js");
const { verifyJWT } = require("../middlewares/auth.middleware.js");

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPlaylist);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatedPlaylist)
  .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

module.exports = router;
