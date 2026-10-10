import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const extension = file.originalname.toLowerCase().split(".").pop();
    if (!["xlsx", "csv"].includes(extension)) {
      const error = new Error("Upload an .xlsx or .csv student sheet.");
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  }
});

export default upload;