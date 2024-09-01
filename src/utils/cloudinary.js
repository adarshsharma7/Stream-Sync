// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';
// import path from 'path';

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.API_KEY,
//   api_secret: process.env.API_SECRET,
//   secure: true,
// });

// export const uploadOnCloudinary = async (base64Data) => {
//   let tempFilePath;
//   try {
//     if (!base64Data) return null;

//     // Decode base64 and save to a temporary file
//     const buffer = Buffer.from(base64Data.split(',')[1], 'base64'); // Split and remove the prefix
//     tempFilePath = path.join(__dirname, '../../../../../../public/temp', `tempFile_${Date.now()}.tmp`);

//     fs.writeFileSync(tempFilePath, buffer);

//     console.log("Uploading to Cloudinary...");

//     // Upload the file to Cloudinary
//     let response = await cloudinary.uploader.upload(tempFilePath, {
//       resource_type: 'auto',
//     });

//     console.log("Upload successful");

//     // Remove the temporary file
//     if (fs.existsSync(tempFilePath)) {
//       fs.unlinkSync(tempFilePath);
//     }

//     return response;

//   } catch (error) {
//     // Ensure the temporary file is removed in case of error
//     if (tempFilePath && fs.existsSync(tempFilePath)) {
//       fs.unlinkSync(tempFilePath);
//     }
//     console.log("Error in Cloudinary upload:", error);
//     return null;
//   }
// };





// // export const uploadOnCloudinary = async (base64Data, fileName) => {
// //   try {
// //     if (!base64Data || !fileName) return null;

// //     const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
// //     let resourceType = "auto";

// //     if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
// //       resourceType = "image";
// //     } else if (fileName.match(/\.(mp4|avi|mkv|mov)$/)) {
// //       resourceType = "video";
// //     }

// //     const response =  cloudinary.uploader.upload_stream(
// //       { resource_type: resourceType },
// //       (error, result) => {
// //         if (error) throw error;
// //         return result;
// //       }
// //     ).end(buffer);

// //     return response;

// //   } catch (error) {
// //     console.log("Error in Cloudinary upload:", error);
// //     return null;
// //   }
// // }


import {v2 as cloudinary} from 'cloudinary';
// import {writeFile} from "fs/promises"
// import fs from 'fs'
   
cloudinary.config({ 
  cloud_name:`${process.env.CLOUD_NAME}`,
  api_key:`${process.env.API_KEY}`,
  api_secret:`${process.env.API_SECRET}`,
  secure:true,
});
const uploadOnCloudinary=async(avatar)=>{
  const byteData = await avatar.arrayBuffer();
    const buffer = Buffer.from(byteData);
    const base64String = buffer.toString('base64');
    const dataURI = `data:${avatar.type};base64,${base64String}`;

  // const path=`./public/temp/${avatar.name}`
  
  // await writeFile(path,buffer)
 console.log("Upload hone jaa raha hai");
 
try {
     const avatarResponse = await cloudinary.uploader.upload(dataURI, {
  resource_type: 'auto',
});
console.log("Upload hogaya hai");

// Remove the temporary file
// fs.unlinkSync(path);
return avatarResponse;
        
 } catch (error) {
    //  fs.unlinkSync(path)
     console.log( "ho ni paara ab bhi",error);
 }
 } 
 export {uploadOnCloudinary}