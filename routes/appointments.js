const express = require("express");
const { body, validationResult } = require("express-validator");
const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth");

const router = express.Router();

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
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        fullName,
        email,
        phone,
        service,
        appointmentDate,
        timeSlot,
        notes,
      } = req.body;

      // Check if the time slot is available for the selected date
      const isAvailable = await Appointment.checkTimeSlotAvailability(
        appointmentDate,
        timeSlot
      );

      if (!isAvailable) {
        return res.status(400).json({
          message:
            "This time slot is already booked. Please select another time.",
        });
      }

      // Create new appointment
      const appointment = await Appointment.create({
        userId: req.user.id,
        fullName,
        email,
        phone,
        service,
        appointmentDate,
        timeSlot,
        notes,
      });

      res.status(201).json({
        message: "Appointment booked successfully",
        appointment: {
          id: appointment.id,
          fullName: appointment.fullName,
          service: appointment.service,
          appointmentDate: appointment.appointmentDate,
          timeSlot: appointment.timeSlot,
          status: appointment.status,
        },
      });
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get user's appointments
router.get("/my-appointments", auth, async (req, res) => {
  try {
    const appointments = await Appointment.findByUserId(req.user.id);
    res.json({ appointments });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get specific appointment
router.get("/:id", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if the appointment belongs to the user
    if (appointment.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ appointment });
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update appointment
router.put(
  "/:id",
  auth,
  [
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
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Check if the appointment belongs to the user
      if (appointment.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if appointment can be updated (not completed or cancelled)
      if (
        appointment.status === "completed" ||
        appointment.status === "cancelled"
      ) {
        return res.status(400).json({
          message: "Cannot update completed or cancelled appointment",
        });
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
  }
);

// Cancel appointment
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if the appointment belongs to the user
    if (appointment.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Appointment is already cancelled" });
    }

    if (appointment.status === "completed") {
      return res
        .status(400)
        .json({ message: "Cannot cancel completed appointment" });
    }

    const updatedAppointment = await Appointment.updateById(req.params.id, {
      status: "cancelled",
    });

    res.json({
      message: "Appointment cancelled successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error(
      "Cancel appointment error:",
      error.stack || error.message || error
    );
    res.status(500).json({ message: "Server error" });
  }
});

// Get available time slots for a date
router.get("/available-slots/:date", auth, async (req, res) => {
  try {
    const { date } = req.params;
    const appointmentDate = new Date(date);

    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const availableSlots = await Appointment.getAvailableTimeSlots(
      appointmentDate
    );
    res.json({ availableSlots });
  } catch (error) {
    console.error("Get available slots error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
