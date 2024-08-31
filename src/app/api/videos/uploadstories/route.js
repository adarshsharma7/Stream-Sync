import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Stories from "@/models/stories.models";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";
import axios from "axios";




export async function POST(request) {
    // if (!io) {
    //     io = new Server(NextResponse.socket.server); // initialize only once
    //     io.on("connection", (socket) => {
    //       console.log("Client connected");
    //     });
    //   }
    //   NextResponse.end();
    // }

    const session = await getServerSession(authOptions);
    const _user = session.user;

    if (!_user || !session) {
        return NextResponse.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    try {
        await dbConnect();
        let { Url } = await request.json()

        let user = await User.findById(_user._id)
        let currStories = await Stories.create({
            file: Url,
            owner: user._id
        })
        user.stories.push(currStories._id)
        await user.save()
        console.log(currStories.createdAt);


        // global.io.emit('new_story', {
        //     story: {
        //       file: Url,
        //       _id: currStories._id,
        //       createdAt: currStories.createdAt,
        //       owner: user._id
        //     },
        //     userId: user._id
        //   });

        // Make a request to Socket.IO server to emit the new story
        // await axios.post('http://localhost:4000/emit-story', {
        //     story: {
        //         _id: currStories._id,
        //         file: Url,
        //         createdAt: currStories.createdAt,
        //         owner: user._id
        //     },
        //     userId: user._id
        // });

        return NextResponse.json({
            success: true,
            currStoryId: currStories._id,
            message: "Story added"
        }, { status: 200 })

    } catch (error) {
        console.log("kuch galt", error);

        return NextResponse.json({
            success: false,
            message: "something wrong"
        }, { status: 500 })
    }
}