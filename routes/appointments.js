// === Updated routes/appointments.js ===
const express = require("express");
const { body, validationResult } = require("express-validator");
const Appointment = require("../models/Appointment");
const { auth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Middleware: validate and parse ID
const parseId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid appointment ID" });
  }
  req.params.id = id;
  next();
};

// Create new appointment
router.post(
  "/book",
  auth,
  [
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("phone").notEmpty().withMessage("Phone number is required"),
    body("service")
      .isIn(["cleaning", "whitening", "braces", "implants"])
      .withMessage("Invalid service selected"),
    body("appointmentDate")
      .isISO8601()
      .withMessage("Please provide a valid date"),
    body("timeSlot")
      .isIn([
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
      ])
      .withMessage("Invalid time slot selected"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const data = req.body;

      const isAvailable = await Appointment.checkTimeSlotAvailability(
        data.appointmentDate,
        data.timeSlot
      );

      if (!isAvailable) {
        return res.status(400).json({
          message: "This time slot is already booked. Please select another time.",
        });
      }

      const appointment = await Appointment.create({
        ...data,
        userId: req.user.id,
      });

      res.status(201).json({
        message: "Appointment booked successfully",
        appointment,
      });
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// User - Get user's appointments
router.get("/my-appointments", auth, async (req, res) => {
  try {
    const appointments = await Appointment.findByUserId(req.user.id);
    res.json({ appointments });
  } catch (error) {
    console.error("Get user appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin - Get all appointments
router.get("/all-appointments", adminAuth, async (req, res) => {
  try {
    const appointments = await Appointment.findAll();
    res.json({ appointments });
  } catch (error) {
    console.error("Get all appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin - Update appointment by ID
router.put("/appointments/:id", adminAuth, parseId, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const updated = await Appointment.updateById(req.params.id, req.body);
    res.json({ message: "Appointment updated successfully", appointment: updated });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// User - Cancel appointment
router.patch("/appointments/:id/cancel", auth, parseId, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user owns this appointment
    if (appointment.userId !== req.user.id) {
      return res.status(403).json({ message: "You can only cancel your own appointments" });
    }

    // Check if appointment can be cancelled (only pending appointments)
    if (appointment.status !== 'pending') {
      return res.status(400).json({ message: "Only pending appointments can be cancelled" });
    }

    const updated = await Appointment.updateById(req.params.id, { status: 'cancelled' });
    res.json({ message: "Appointment cancelled successfully", appointment: updated });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin - Delete appointment by ID
router.delete("/appointments/:id", adminAuth, parseId, async (req, res) => {
  try {
    const deleted = await Appointment.deleteById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
