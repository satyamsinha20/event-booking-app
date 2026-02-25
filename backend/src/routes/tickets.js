const express = require("express");
const { z } = require("zod");
const crypto = require("crypto");

const { requireAuth, requireAdmin } = require("../middleware/auth");
const { Event } = require("../models/Event");
const { Ticket } = require("../models/Ticket");

const router = express.Router();

function newTicketCode() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return crypto.randomBytes(16).toString("hex");
}

// Book a ticket for an event
router.post("/book", requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      eventId: z.string().min(1),
      utr: z.string().min(1).optional() // Transaction / UTR number for paid events
    });
    const { eventId, utr } = schema.parse(req.body);

    // Reserve 1 ticket atomically (no Mongo transactions required)
    const event = await Event.findOneAndUpdate(
      { _id: eventId, availableTickets: { $gt: 0 } },
      { $inc: { availableTickets: -1 } },
      { new: true }
    );

    if (!event) return res.status(409).json({ message: "Sold out or event not found" });

    const isPaid = Number(event.price || 0) > 0;

    if (isPaid && !utr) {
      // Undo reservation if payment reference is missing
      await Event.updateOne({ _id: event._id }, { $inc: { availableTickets: 1 } });
      return res.status(400).json({ message: "Payment reference (UTR) is required for paid events" });
    }

    let ticket;
    try {
      ticket = await Ticket.create({
        userId: req.user._id,
        eventId: event._id,
        ticketCode: newTicketCode(),
        status: isPaid ? "pending" : "confirmed",
        paymentRef: isPaid ? utr : undefined,
        amount: event.price
      });
    } catch (err) {
      // Rollback reservation
      await Event.updateOne({ _id: event._id }, { $inc: { availableTickets: 1 } });
      throw err;
    }

    res.status(201).json({
      ticket: {
        _id: ticket._id,
        eventId: ticket.eventId,
        userId: ticket.userId,
        ticketCode: ticket.ticketCode,
        status: ticket.status,
        createdAt: ticket.createdAt,
        paymentRef: ticket.paymentRef,
        amount: ticket.amount
      }
    });
  } catch (err) {
    next(err);
  }
});

// Current user's tickets (with event details)
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("eventId")
      .lean();
    res.json({ tickets });
  } catch (err) {
    next(err);
  }
});

// Admin: pending ticket payments for manual verification
router.get("/pending", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const tickets = await Ticket.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .populate("userId", "_id name email")
      .populate("eventId")
      .lean();

    res.json({ tickets });
  } catch (err) {
    next(err);
  }
});

// Admin: confirm a pending ticket after verifying payment
router.post("/:id/confirm", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { $set: { status: "confirmed" } },
      { new: true }
    ).lean();

    if (!ticket) return res.status(404).json({ message: "Ticket not found or not pending" });
    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

// Admin: attendees for an event
router.get("/event/:eventId/attendees", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });

    const tickets = await Ticket.find({
      eventId: event._id,
      status: { $nin: ["cancelled", "pending"] }
    })
      .sort({ createdAt: -1 })
      .populate("userId", "_id name email")
      .lean();

    res.json({
      event,
      totalTickets: tickets.length,
      attendees: tickets.map((t) => ({
        ticketId: t._id,
        ticketCode: t.ticketCode,
        status: t.status,
        createdAt: t.createdAt,
        user: t.userId
      }))
    });
  } catch (err) {
    next(err);
  }
});

// Admin: check-in a ticket by code (QR -> code)
router.post("/check-in", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const schema = z.object({ ticketCode: z.string().min(1) });
    const { ticketCode } = schema.parse(req.body);

    const ticket = await Ticket.findOneAndUpdate(
      { ticketCode, status: { $in: ["confirmed", "booked"] } },
      { $set: { status: "checked_in" } },
      { new: true }
    )
      .populate("userId", "_id name email")
      .populate("eventId", "_id title")
      .lean();

    if (!ticket) return res.status(404).json({ message: "Ticket not found or already checked-in" });
    res.json({ ticket });
  } catch (err) {
    next(err);
  }
});

// Admin: simple sales analytics
router.get("/stats", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const agg = await Ticket.aggregate([
      { $match: { status: { $in: ["confirmed", "checked_in", "booked"] } } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "_id",
          as: "event"
        }
      },
      { $unwind: "$event" },
      {
        $group: {
          _id: null,
          ticketsSold: { $sum: 1 },
          revenue: { $sum: "$event.price" }
        }
      }
    ]);

    const row = agg[0] || { ticketsSold: 0, revenue: 0 };
    res.json({ ticketsSold: row.ticketsSold, revenue: row.revenue });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

