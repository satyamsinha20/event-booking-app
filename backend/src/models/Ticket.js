const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    ticketCode: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "checked_in", "cancelled", "booked"],
      default: "confirmed"
    },
    // Ticket usage type – currently we only use "one_time"
    type: {
      type: String,
      enum: ["one_time", "multi_use"],
      default: "one_time"
    },
    // When this timestamp passes, MongoDB will automatically delete the ticket (TTL index below)
    expiresAt: { type: Date },
    paymentRef: { type: String },
    amount: { type: Number }
  },
  { timestamps: true }
);

TicketSchema.index({ userId: 1, eventId: 1, createdAt: -1 });
TicketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);

module.exports = { Ticket };

