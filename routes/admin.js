const express = require("express");
const { body, validationResult } = require("express-validator");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const admin = require("../middleware/admin");

const router = express.Router();

// Get all appointments (admin only)
router.get("/appointments", admin, async (req, res) => {
  try {
    const appointments = await Appointment.findAll();
    res.json({ appointments });
  } catch (error) {
    console.error("Get all appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get appointment by ID (admin only)
router.get("/appointments/:id", admin, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ appointment });
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update appointment status (admin only)
router.patch("/appointments/:id/status", admin, [
  body("status")
    .isIn(["pending", "confirmed", "completed", "cancelled"])
    .withMessage("Invalid status"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const updatedAppointment = await Appointment.updateById(req.params.id, {
      status: req.body.status,
    });

    res.json({
      message: "Appointment status updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update appointment details (admin only)
router.put("/appointments/:id", admin, [
  body("appointmentDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date"),
  body("timeSlot")
    .optional()
    .isIn([
      "09:00 AM",
      "09:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "02:00 PM",
      "02:30 PM",
      "03:00 PM",
      "03:30 PM",
      "04:00 PM",
      "04:30 PM",
    ])
    .withMessage("Invalid time slot selected"),
  body("notes").optional().isString().withMessage("Notes must be a string"),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const { appointmentDate, timeSlot, notes } = req.body;

    // If date or time is being changed, check availability
    if (
      (appointmentDate &&
        appointment.appointmentDate.toISOString().split("T")[0] !==
          appointmentDate.split("T")[0]) ||
      (timeSlot && appointment.timeSlot !== timeSlot)
    ) {
      const isAvailable = await Appointment.checkTimeSlotAvailability(
        appointmentDate || appointment.appointmentDate,
        timeSlot || appointment.timeSlot,
        appointment.id
      );

      if (!isAvailable) {
        return res.status(400).json({
          message:
            "This time slot is already booked. Please select another time.",
        });
      }
    }

    // Update appointment
    const updateData = {};
    if (appointmentDate) updateData.appointmentDate = appointmentDate;
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (notes !== undefined) updateData.notes = notes;

    const updatedAppointment = await Appointment.updateById(
      req.params.id,
      updateData
    );

    res.json({
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete appointment (admin only)
router.delete("/appointments/:id", admin, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await Appointment.deleteById(req.params.id);

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get appointment statistics (admin only)
router.get("/statistics", admin, async (req, res) => {
  try {
    const stats = await Appointment.getStatistics();
    res.json({ statistics: stats });
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (admin only)
router.get("/users", admin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router; 