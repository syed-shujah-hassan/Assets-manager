const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    responderId: { type: String, required: true },
    responderName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
  },
  { timestamps: true, collection: 'feedback' }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
