import verifyonsignup from "@/models/verifyEmailModel.js"
import { connect } from "@/dbConfig/dbConfig";
import {NextRequest,NextResponse} from 'next/server'

connect()

export async function POST(request:NextRequest){
try {
    const {id}=await request.json()
    let user=await verifyonsignup.findById(id)

    return NextResponse.json({isVarified:user.isvarified})
} catch (error) {
    return NextResponse.json({error:"kuch error hai"})
}
}