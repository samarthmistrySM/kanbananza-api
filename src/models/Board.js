import mongoose from "mongoose";
const Schema = mongoose.Schema;

const boardSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    columns: [{ type: Schema.Types.ObjectId, ref: "Column" }],
  },
  { timestamps: true }
);

boardSchema.pre(
  "deleteOne",
  { document: false, query: true },
  async function (next) {
    const boardId = this.getQuery()["_id"];
    await mongoose.model("Column").deleteMany({ board: boardId });
    await mongoose
      .model("User")
      .updateMany({ boards: boardId }, { $pull: { boards: boardId } });
    next();
  }
);

export default mongoose.model("Board", boardSchema);
