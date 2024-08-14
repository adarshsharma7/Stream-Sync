import mongoose from 'mongoose'
const likeSchema = new mongoose.Schema({
    likeOnVideo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos"
    },
    likeOnComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })
export const Likes= mongoose.models.Likes || mongoose.model("Likes",likeSchema)