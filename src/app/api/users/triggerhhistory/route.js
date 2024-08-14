import { dbConnect } from "@/dbConfig/dbConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import User from "@/models/userModel";



export async function GET() {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const _user = session?.user;

    if (!_user || !session) {
        console.log("User is not authenticated");
        return Response.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    try {
        let user=await User.findById(_user._id)
        return Response.json({
            success:true,
            data:user.triggerWatchHistory
        },{status:200})
    } catch (error) {
        console.log("kuch galt hua",error);
        
        return Response.json({
            success:false,
            message:"Something went wrong"
        },{status:500})
    }
}




export async function POST(request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const _user = session?.user;

    if (!_user || !session) {
        console.log("User is not authenticated");
        return Response.json({
            success: false,
            message: 'Not Authenticated',
        }, { status: 400 });
    }
    try {
        let user=await User.findById(_user._id)
        const{history}=await request.json()
        user.triggerWatchHistory=history
        await user.save()

        return Response.json({
            success:true,
            data:user.triggerWatchHistory
        },{status:200})
    } catch (error) {
        console.log("kuch galt hua",error);
        
        return Response.json({
            success:false,
            message:"Something went wrong"
        },{status:500})
    }
}