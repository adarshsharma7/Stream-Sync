import mongoose from 'mongoose'
const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description:{
        type: String,
        required: true,
    },
    content: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Videos"
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })
export const Playlist=mongoose.model("Playlist",playlistSchema)