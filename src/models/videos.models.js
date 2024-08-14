import mongoose from 'mongoose'
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const videosSchema = new mongoose.Schema({
    videoFile: {
        type: String,
        required: true

    },
    thumbnail: {
        type: String,
        required: true

    },
    title: {
        type: String,
        required: true

    },
    description: {
        type: String,
        required: true
    },
    views:{
        type: Number,
        default: 0
    },
    likes:{
        type:Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

videosSchema.plugin(mongooseAggregatePaginate)

export const Videos =mongoose.models.Videos || mongoose.model("Videos", videosSchema)
