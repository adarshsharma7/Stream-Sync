import mongoose from 'mongoose'
const notificationSchema = new mongoose.Schema({
  msg:{
    type:String
  },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })
export const Notifications= mongoose.models.Notifications || mongoose.model("Notifications",notificationSchema)