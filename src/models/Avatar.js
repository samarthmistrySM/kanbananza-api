import mongoose from "mongoose";

const AvatarSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, required: true },
});

export default mongoose.model("Avatar", AvatarSchema);