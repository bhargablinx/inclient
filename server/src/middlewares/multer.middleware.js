import multer from "multer";
import crypto from "crypto";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./upload");
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = crypto.randomUUID();
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

export const upload = multer({
    storage,
});
