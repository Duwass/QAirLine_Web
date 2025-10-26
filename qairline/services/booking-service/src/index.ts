import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookingRoutes from './routes/bookingRoutes';
import { BookingController } from './controllers/BookingController';

dotenv.config();

const app = express();
const bookingController = new BookingController();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/Bookings', bookingRoutes);

// Route đặc biệt cho getUserFlights (theo cấu trúc backend cũ)
app.post('/api/Flights/GetUserFlights', bookingController.getUserFlights.bind(bookingController));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  console.log(`Booking service is running on port ${PORT}`);
});