import mongoose from "mongoose";


const dbObj={

}

export const dbConnect=async()=>{
    
if(dbObj.dbConnect){
    console.log("DB Already connected");
    return;
    
}
try {
    const db=await mongoose.connect(`${process.env.MONGO_DB_LINK}/${process.env.DATA_BASE_NAME}`) 
    dbObj.dbConnect=db.connections[0].readyState
    console.log("db Connected");
} catch (error) {
    console.log("DB Connection failed",error);
    process.exit(1)
}

}





