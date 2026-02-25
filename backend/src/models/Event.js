const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "general", trim: true },
    description: { type: String, default: "" },
    location: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    // Optional explicit expiry time for the event; used to expire tickets
    expiresAt: { type: Date },
    imageUrl: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    availableTickets: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

EventSchema.index({ date: 1 });
EventSchema.index({ category: 1, date: 1 });

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

module.exports = { Event };

