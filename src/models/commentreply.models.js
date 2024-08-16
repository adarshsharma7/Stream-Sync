import mongoose from 'mongoose'

const commentReplySchema = new mongoose.Schema({
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
    replies: [{
       type: mongoose.Schema.Types.ObjectId,
        ref: "CommentReply"
    }],

    replyOnComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })
export const CommentReply = mongoose.models.CommentReply || mongoose.model("CommentReply", commentReplySchema)