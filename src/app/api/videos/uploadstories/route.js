import { dbConnect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Stories from "@/models/stories.models";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";



export async function POST(request){

    
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
        let {Url}=await request.json()
        console.log(Url);
        
        let user=await User.findById(_user._id)
        let currStories=await Stories.create({
            file:Url,
            owner:user._id
        })
        user.stories.push(currStories._id)
        await user.save()
        return NextResponse.json({
            success:true,
            message:"Story added"
        },{status:200})
        
    } catch (error) {
        console.log("kuch galt",error);
        
        return NextResponse.json({
            success:false,
            message:"something wrong"
        },{status:500})
    }
}