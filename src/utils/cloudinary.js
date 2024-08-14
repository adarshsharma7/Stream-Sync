import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const uploadOnCloudinary = async (base64Data, fileName) => {
  let tempFilePath;
  try {
    if (!base64Data || !fileName) return null;

     tempFilePath = path.join(__dirname, '../../../../../../public/temp', fileName);

    // Decode base64 and save to a file
    const buffer = Buffer.from(base64Data.split(',')[1], 'base64'); // Split and remove the prefix
    fs.writeFileSync(tempFilePath, buffer);
    let resourceType = "auto";
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
        resourceType = "image";
    } else if (fileName.match(/\.(mp4|avi|mkv|mov)$/)) {
        resourceType = "video";
    }

    console.log("upload hone jaa raha hai clodinary pa");

    let response = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: resourceType,
    });
    console.log("upload hone k baad ka hisab h yuu");
    // Remove the temporary file
    fs.unlinkSync(tempFilePath);

    return response;

  } catch (error) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    console.log("Error in Cloudinary upload:", error);
    return null;
  }
  
}

export { uploadOnCloudinary };
