const mongoose = require('mongoose');

const responderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    cnic: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    zone: { type: String, trim: true },
    vehicleType: { type: String, enum: ['Ambulance', 'Bike', 'Fire Truck', 'Other'], default: 'Ambulance' },
    availability: { type: String, enum: ['Available', 'Busy', 'Inactive'], default: 'Available' },
    lastKnownCoordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    lastKnownAccuracy: { type: Number },
    lastKnownUpdatedAt: { type: Date },
    totalResolved: { type: Number, default: 0 },
    joinDate: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'responders' }
);

const Responder = mongoose.model('Responder', responderSchema);

module.exports = Responder;
