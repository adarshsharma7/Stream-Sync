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
        const { title, description, videoFile, thumbnail } = await request.json();

        const videoFileName = `video_${Date.now()}.mp4`;
        const thumbnailFileName = `thumbnail_${Date.now()}.jpg`;
        const videoResponse = await uploadOnCloudinary(videoFile, videoFileName);
        const thumbnailResponse = await uploadOnCloudinary(thumbnail, thumbnailFileName);

        if (!videoResponse) {
            return NextResponse.json({
                success: false,
                message: 'Error while uploading video',
            }, { status: 500 });
        }

        if (!thumbnailResponse) {
            return NextResponse.json({
                success: false,
                message: 'Error while uploading thumbnail',
            }, { status: 500 });
        }

        const video = await Videos.create({
            title,
            description,
            videoFile: videoResponse?.url,
            thumbnail: thumbnailResponse?.url,
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
