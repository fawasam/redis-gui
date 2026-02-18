
import mongoose, { Schema } from 'mongoose';

const ConnectionSchema = new Schema({
  name: { type: String, required: true },
  host: { type: String, required: true },
  port: { type: Number, required: true },
  username: { type: String },
  password: { type: String },
  db: { type: Number, default: 0 },
  tls: { type: Boolean, default: false },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Connection || mongoose.model('Connection', ConnectionSchema);
