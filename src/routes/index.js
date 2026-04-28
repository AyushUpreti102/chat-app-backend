const { Router, static } = require("express");
const upload = require("../middleware/upload");

const authRoutes = require("./auth");
const userRoutes = require("./user");
const chatRoutes = require("./chat");

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/chat", chatRoutes);

router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    res.json({
      url: fileUrl,
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

module.exports = router;
