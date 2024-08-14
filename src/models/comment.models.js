import mongoose from 'mongoose'
import { type } from 'os'
const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    edited:{
        type:Boolean,
        default:false
    },
    likes: [{
       type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],

    commentOnVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })
export const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema)