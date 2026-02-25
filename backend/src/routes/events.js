const express = require("express");

const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require("../controllers/eventController");

const router = express.Router();

router.get("/", listEvents);
router.get("/:id", getEventById);
router.post("/", requireAuth, requireAdmin, createEvent);
router.put("/:id", requireAuth, requireAdmin, updateEvent);
router.delete("/:id", requireAuth, requireAdmin, deleteEvent);

module.exports = router;

