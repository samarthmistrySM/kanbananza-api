import mongoose from "mongoose";
const Schema = mongoose.Schema;

const cardSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    column: { type: Schema.Types.ObjectId, ref: "Column", required: true },
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    order: { type: Number },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    dueDate: { type: Date },
    labels: [{ type: String }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

cardSchema.pre("save", async function (next) {
  if (this.isNew && (this.order === undefined || this.order === null)) {
    const lastCard = await mongoose
      .model("Card")
      .findOne({ column: this.column })
      .sort("-order")
      .select("order")
      .exec();
    this.order =
      lastCard && typeof lastCard.order === "number" ? lastCard.order + 1 : 0;
  }
  next();
});

cardSchema.pre("deleteMany", async function (next) {
  const comments = await this.model.find(this.getQuery());
  const cardIds = comments.map((card) => card._id);

  await mongoose.model("Comment").deleteMany({ card: { $in: cardIds } });
  next();
});

cardSchema.pre("deleteOne", async function (next) {
  const cardId = this.getQuery()["_id"];
  await mongoose.model("Comment").deleteMany({ card: cardId });
  await mongoose
    .model("Column")
    .updateMany({ cards: cardId }, { $pull: { cards: cardId } });
  next();
});

export default mongoose.model("Card", cardSchema);
