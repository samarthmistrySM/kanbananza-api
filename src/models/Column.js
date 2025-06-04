import mongoose from "mongoose";
const Schema = mongoose.Schema;

const columnSchema = new Schema(
  {
    title: { type: String, required: true },
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    order: { type: Number },
    cards: [{ type: Schema.Types.ObjectId, ref: "Card" }],
  },
  { timestamps: true }
);

columnSchema.pre("save", async function (next) {
  if (this.isNew && (this.order === undefined || this.order === null)) {
    const lastColumn = await mongoose
      .model("Column")
      .findOne({ board: this.board })
      .sort("-order")
      .exec();
    this.order = lastColumn ? lastColumn.order + 1 : 0;
  }
  next();
});

columnSchema.pre("deleteMany", async function (next) {
  const columns = await this.model.find(this.getQuery());
  const columnIds = columns.map((col) => col._id);

  await mongoose.model("Card").deleteMany({ column: { $in: columnIds } });
  next();
});

columnSchema.pre("deleteOne", async function (next) {
  const columnId = this.getQuery()["_id"];
  await mongoose.model("Card").deleteMany({ column: columnId });
  await mongoose
    .model("Board")
    .updateMany({ columns: columnId }, { $pull: { columns: columnId } });
  next();
});

export default mongoose.model("Column", columnSchema);
