import { NextRequest } from "next/server";
import {upload} from "../../../utils/multer"
export async function POST(req,res){
upload.single("file")
}