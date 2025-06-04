import mongoose from "mongoose";
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

commentSchema.pre("deleteOne",async function (next){
  const commentId = this.getQuery()["_id"];
  await mongoose.model("Card").updateMany({
    comments: commentId
  }, {$pull: {comments: commentId}})
  next();
})

export default mongoose.model("Comment", commentSchema);
