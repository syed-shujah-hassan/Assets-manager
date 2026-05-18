const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    userId: { type: String },
    userName: { type: String },
    userPhone: { type: String },
    description: { type: String, required: true },
    location: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    citizenLiveCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    citizenLiveAccuracy: { type: Number },
    citizenLiveUpdatedAt: { type: Date },
    responderLiveCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    responderLiveAccuracy: { type: Number },
    responderLiveUpdatedAt: { type: Date },
    photoUrl: { type: String },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'En Route', 'Arrived', 'Resolved', 'Cancelled'],
      default: 'Pending',
    },
    responderId: { type: String },
    responderName: { type: String },
    responderPhone: { type: String },
    distance: { type: String },
  },
  { timestamps: true, collection: 'requests' }
);

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
