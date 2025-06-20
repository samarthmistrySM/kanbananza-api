import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'CARD_CREATED',
      'CARD_MOVED',
      'CARD_UPDATED',
      'CARD_DELETED',
      'COLUMN_CREATED',
      'COLUMN_UPDATED',
      'COLUMN_DELETED',
      'COMMENT_ADDED',
      'COMMENT_DELETED',
      'BOARD_CREATED',
      'BOARD_UPDATED',
      'BOARD_DELETED'
    ]
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
  card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
  column: { type: mongoose.Schema.Types.ObjectId, ref: 'Column' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Activity', activitySchema);