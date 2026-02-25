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
    paymentRef: { type: String },
    amount: { type: Number }
  },
  { timestamps: true }
);

TicketSchema.index({ userId: 1, eventId: 1, createdAt: -1 });

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);

module.exports = { Ticket };

