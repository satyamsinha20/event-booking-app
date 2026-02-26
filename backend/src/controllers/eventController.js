const { z } = require("zod");

const { Event } = require("../models/Event");
const { Ticket } = require("../models/Ticket");

async function listEvents(req, res, next) {
  try {
    const schema = z.object({
      category: z.string().min(1).max(50).optional(),
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
      upcoming: z
        .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
        .optional()
    });
    const q = schema.parse(req.query);

    const filter = {};
    if (q.category) filter.category = q.category;

    const dateFilter = {};
    if (q.upcoming === "1" || q.upcoming === "true") {
      filter.expiresAt = { $gte: new Date() };
    }
    if (q.from) dateFilter.$gte = new Date(q.from);
    if (q.to) dateFilter.$lte = new Date(q.to);
    if (Object.keys(dateFilter).length) filter.date = dateFilter;

    const events = await Event.find(filter).sort({ date: 1 }).lean();
    res.json({ events });
  } catch (err) {
    next(err);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200),
      category: z.string().min(1).max(50).default("general"),
      description: z.string().max(5000).optional().default(""),
      location: z.string().min(1).max(200),
      date: z.coerce.date(),
      expiresAt: z.coerce.date().optional(),
      imageUrl: z.string().url().optional(),
      price: z.number().min(0),
      availableTickets: z.number().int().min(0),
      bookingEnabled: z.boolean().optional().default(true)
    });
    const data = schema.parse(req.body);

    const event = await Event.create(data);
    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      category: z.string().min(1).max(50).optional(),
      description: z.string().max(5000).optional(),
      location: z.string().min(1).max(200).optional(),
      date: z.coerce.date().optional(),
      expiresAt: z.coerce.date().optional(),
      imageUrl: z.string().url().optional(),
      price: z.number().min(0).optional(),
      availableTickets: z.number().int().min(0).optional(),
      bookingEnabled: z.boolean().optional()
    });
    const data = schema.parse(req.body);

    const event = await Event.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!event) return res.status(404).json({ message: "Event not found" });

    // If the event expiry or date changed, keep associated tickets in sync so TTL deletion matches
    if (data.expiresAt || data.date) {
      const newExpiresAt = data.expiresAt || data.date;
      await Ticket.updateMany({ eventId: event._id }, { expiresAt: newExpiresAt });
    }
    res.json({ event });
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
};

