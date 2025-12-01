import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://shivangishreya2:shivangi20@examcluster1.84oiyjy.mongodb.net/?appName=ExamCluster1");
    console.log("MongoDB Connected");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

export default connectDB;
