const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    details: { type: String, required: true },
    userId: { type: String },
    userName: { type: String },
    requestId: { type: String },
    responderId: { type: String },
    entityType: { type: String }, // 'request', 'responder', 'user', 'system'
  },
  { timestamps: true, collection: 'logs' }
);

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
