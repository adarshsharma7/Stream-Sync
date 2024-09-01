import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Stories from "@/models/stories.models";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,  
    key: process.env.PUSHER_KEY,        
    secret: process.env.PUSHER_SECRET,  
    cluster: process.env.PUSHER_CLUSTER, 
  useTLS: true
});



export async function POST(request) {


    const session = await getServerSession(authOptions);
    const _user = session.user;

    if (!_user || !session) {
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    try {
        await dbConnect()
        const { Id } = await request.json()
         
        const stories = await Stories.findById(Id)
        if (!stories) {
            return NextResponse.json({
                success: false,
                message: "story not found"
            }, { status: 400 })
        }
        await User.updateOne({ _id: _user._id }, { $pull: { stories: Id } });
        await Stories.findByIdAndDelete(Id)
   
    //   await axios.post('http://localhost:4000/delete-story', {
    //     userStoryId: Id
    //   });
  
      
    //    io.emit('delete-story',  Id);

     // Emit delete event using Pusher
   let pusherResponse= await pusher.trigger('story-channel', 'delete-story', {
        storyId: Id,
    });
    console.log('Pusher Trigger Response:', pusherResponse);
         

        return NextResponse.json({
            success: true,
            message: 'Story Deleted',
        }, { status: 200 });

    } catch (error) {
        console.log("kuch galt hua" ,error);
        
        return NextResponse.json({
            success: false,
            message: 'something wrong',
        }, { status: 500 });
    }
}