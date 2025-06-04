import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    boards: [{ type: Schema.Types.ObjectId, ref: "Board" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
