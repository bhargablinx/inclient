import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        // Always return secure_url (https) instead of url (http) to prevent
        // Mixed Content warnings when serving assets from an HTTPS frontend.
        return { ...response, url: response.secure_url };
    } catch (error) {
        console.log(error);
        fs.unlinkSync(localFilePath);
        return null;
    }
};
