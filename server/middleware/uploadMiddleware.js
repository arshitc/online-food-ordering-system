const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const folder = req.baseUrl.includes("restaurants")
      ? path.join(__dirname, "..", "uploads", "restaurant-images")
      : path.join(__dirname, "..", "uploads", "food-images");
    cb(null, folder);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`);
  }
});

const fileFilter = (req, file, cb) => {
  const supported = /jpeg|jpg|png|webp/;
  const extension = supported.test(path.extname(file.originalname).toLowerCase());
  const mime = supported.test(file.mimetype);

  if (extension && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

module.exports = multer({ storage, fileFilter });
