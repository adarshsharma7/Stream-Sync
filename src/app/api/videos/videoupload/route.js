import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { dbConnect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';
import { Videos } from '@/models/videos.models';
import { uploadOnCloudinary } from '@/utils/cloudinary';

export async function POST(request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const _user = session.user;

    if (!_user || !session) {
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }

    try {
    // let data = await request.formData();
    // let title = data.get("title");
    // let description = data.get("description");
    // let videoFile = data.get("videoFile");
    // let thumbnail = data.get("thumbnail");
  let {title,description,videoFile,thumbnail}=await request.json()

    if ([title, description, videoFile, thumbnail].some(field => !field)) {
        return NextResponse.json({
          success: false,
          message: "All fields are required"
        }, { status: 400 });
      }
    
        // const videoResponse = await uploadOnCloudinary(videoFile);
        // const thumbnailResponse = await uploadOnCloudinary(thumbnail);

        // if (!videoResponse || !videoResponse.url) {
        //     return NextResponse.json({
        //         success: false,
        //         message: 'Error while uploading video',
        //     }, { status: 500 });
        // }

        // if (!thumbnailResponse || !thumbnailResponse.url) {
        //     return NextResponse.json({
        //         success: false,
        //         message: 'Error while uploading thumbnail',
        //     }, { status: 500 });
        // }

        const video = await Videos.create({
            title,
            description,
            videoFile:videoFile,
            thumbnail: thumbnail,
            owner: _user._id,
        });

        const user = await User.findById(_user._id);
        user.uploadedVideos.push(video._id);
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Video Uploaded',
        }, { status: 200 });

    } catch (error) {
        console.error('Error uploading video:', error);
        return NextResponse.json({
            success: false,
            message: 'Error uploading video',
        }, { status: 500 });
    }
}
