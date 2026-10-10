import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB — matches posts.service.js's MAX_IMAGE_SIZE_BYTES
});

/** Expects the file under the multipart field name "image". */
export const imageUploadMiddleware = upload.single("image");
