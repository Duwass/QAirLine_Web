import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';

const router = Router();
const bookingController = new BookingController();

// Booking routes - match với backend cũ
router.post('/BookFlights', bookingController.bookFlight);
router.post('/CancelBooking', bookingController.cancelBooking);
router.post('/ViewAndSummarize', bookingController.viewAndSummarizeBookings);
router.get('/', bookingController.getAllBookings);
router.get('/user/:userId', bookingController.getUserBookings);
router.delete('/', bookingController.deleteBooking);

// Payment routes
router.post('/payment', bookingController.processPayment);
router.get('/payment/:bookingId', bookingController.getPaymentByBookingId);

export default router;