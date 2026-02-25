const express = require("express");

const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  bookTicket,
  getMyTickets,
  getPendingTickets,
  confirmTicket,
  getEventAttendees,
  checkInTicket,
  getTicketStats
} = require("../controllers/ticketController");

const router = express.Router();

// Book a ticket for an event
router.post("/book", requireAuth, bookTicket);

// Current user's tickets (with event details)
router.get("/mine", requireAuth, getMyTickets);

// Admin: pending ticket payments for manual verification
router.get("/pending", requireAuth, requireAdmin, getPendingTickets);

// Admin: confirm a pending ticket after verifying payment
router.post("/:id/confirm", requireAuth, requireAdmin, confirmTicket);

// Admin: attendees for an event
router.get("/event/:eventId/attendees", requireAuth, requireAdmin, getEventAttendees);

// Admin: check-in a ticket by code (QR -> code)
router.post("/check-in", requireAuth, requireAdmin, checkInTicket);

// Admin: simple sales analytics
router.get("/stats", requireAuth, requireAdmin, getTicketStats);

module.exports = router;

