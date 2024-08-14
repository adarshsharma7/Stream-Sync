import mongoose from "mongoose"

const verifyOnSignup=new mongoose.Schema({
 
  email:{
    type:String,
    required:[true,"please provide email"],
    unique:true
  } ,
  
  isvarified:{
    type:Boolean,
    default:false
  },
    verifyToken:String,
    verifyTokenExpiry:Date
  
})
const verifyonsignup=mongoose.models.verifyonsignup || mongoose.model("verifyonsignup",verifyOnSignup)
export default verifyonsignup
