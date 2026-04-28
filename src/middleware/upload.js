const multer = require("multer");
const path = require("path");

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);

    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  },
});

// File filter (optional but recommended)
const fileFilter = (req, file, cb) => {
  // allow all for now OR restrict:
  // if (!file.mimetype.startsWith("image/")) return cb(new Error("Only images allowed"));
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
