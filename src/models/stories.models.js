import mongoose from 'mongoose'

let storiesSchema=new mongoose.Schema({
file:{
    type:String,
    required:[true,"Please Provide file"]
},
owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
},
 
},{timestamps:true})
let Stories=mongoose.models.Stories || mongoose.model("Stories",storiesSchema)

export default Stories