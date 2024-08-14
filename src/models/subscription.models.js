import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema({
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

export const Subsciption = mongoose.model("Subsciption", subscriptionSchema)