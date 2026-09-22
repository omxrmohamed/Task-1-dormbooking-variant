import { Booking } from '../models/Booking.js';
import Joi from 'joi';


// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  roomNumber: Joi.string().required(),
  purpose: Joi.string().optional(),
  bookedBy: Joi.string().required()
});

const updateSchema = Joi.object({
  startDate: Joi.date(),
  endDate: Joi.date().greater(Joi.ref('startDate')),
  roomNumber: Joi.string(),
  purpose: Joi.string(),
  bookedBy: Joi.string()
});

// TODO: per README.md section 4, you will need a way to detect whether a
// proposed booking conflicts with an existing one on the same room.

// GET /api/bookings
// TODO: implement per README.md section 3.
export async function getAllBookings(req, res, next) {
  try {
    const bookings = await Booking.find().populate('bookedBy', 'name email').sort({ createdAt: -1 }).lean();
    res.json({ bookings });
  } catch (err) { next(err); }
}

// GET /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id).populate('bookedBy', 'name email');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking });
  } catch (err) { next(err); }
}

// POST /api/bookings
// TODO: implement per README.md sections 3 and 4.
export async function createBooking(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });
    const conflict = await Booking.findOne({
            roomNumber: value.roomNumber,
            startDate: { $lt: value.endDate },
            endDate: { $gt: value.startDate }
        });
        if (conflict) {
            return res.status(409).json({
                message: 'Room is already booked for these dates'
            });
        }
    const booking = await Booking.create(value);
    res.status(201).json({ booking });
    
  } catch (err) { next(err); }
}

// PATCH /api/bookings/:id
// TODO: implement per README.md sections 3, 4, and 5.
export async function updateBooking(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
    const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }
    const conflict = await Booking.findOne({
            _id: { $ne: req.params.id },
            roomNumber: value.roomNumber,
            startDate: { $lt: value.endDate },
            endDate: { $gt: value.startDate }
        });
        if (conflict) {
            return res.status(409).json({
                message: 'Room is already booked for these dates'
            });
        }
              const updatedBooking = await Booking.findByIdAndUpdate(req.params.id,
            value,
            {
                new: true,
                runValidators: true
            }
        );
        return res.status(200).json({
            booking: updatedBooking
        });
  } catch (err) { next(err); }
}

// DELETE /api/bookings/:id
// TODO: implement per README.md sections 3 and 5.
export async function deleteBooking(req, res, next) {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ message: 'Booking deleted' });
  } catch (err) { next(err); }
}
