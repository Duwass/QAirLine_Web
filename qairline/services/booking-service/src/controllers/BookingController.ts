// Controller quan ly bookings va payments
import { Request, Response } from 'express';
import connection from '../database/database';
import { CreateBookingRequest, ProcessPaymentRequest } from '../types/booking';

export class BookingController {
  // Tao booking co ban - chi tao record, chua kiem tra logic phuc tap
  createBooking(req: Request, res: Response): void {
    const bookingData: CreateBookingRequest = req.body;

    if (!bookingData.userId || !bookingData.flightId) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const query = `
      INSERT INTO Bookings (UserID, FlightID) 
      VALUES (?, ?)
    `;

    connection.execute(
      query,
      [bookingData.userId, bookingData.flightId],
      (err, result: any) => {
        if (err) {
          console.error('Error creating booking:', err);
          res.status(500).json({ message: 'Error creating booking', error: err.message });
          return;
        }

        res.status(201).json({
          message: 'Booking created successfully',
          bookingId: result.insertId
        });
      }
    );
  }

  // Lay tat ca bookings (Admin only - dung de quan ly)
  getAllBookings(req: Request, res: Response): void {
    const query = 'SELECT * FROM Bookings';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }

      if ((results as any).length === 0) {
        res.status(404).json({ message: 'No bookings found' });
        return;
      }

      res.status(200).json(results);
    });
  }

  // Lay bookings cua 1 user cu the (User xem bookings cua minh)
  getUserBookings(req: Request, res: Response): void {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: 'Missing user ID' });
      return;
    }

    const query = 'SELECT * FROM Bookings WHERE UserID = ?';
    connection.execute(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching user bookings:', err);
        res.status(500).json({ message: 'Error fetching bookings', error: err.message });
        return;
      }

      if ((results as any).length === 0) {
        res.status(404).json({ message: 'No bookings found for this user' });
        return;
      }

      res.status(200).json(results);
    });
  }

  // Huy booking - update BookingStatus thanh 'cancelled'
  cancelBooking(req: Request, res: Response): void {
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ message: 'Missing booking ID' });
      return;
    }

    const query = 'UPDATE Bookings SET BookingStatus = ? WHERE BookingID = ?';
    connection.execute(query, ['cancelled', bookingId], (err, result: any) => {
      if (err) {
        console.error('Error cancelling booking:', err);
        res.status(500).json({ message: 'Error cancelling booking', error: err.message });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Booking not found' });
        return;
      }

      res.status(200).json({ message: 'Booking cancelled successfully' });
    });
  }

  // Xu ly thanh toan - tao payment record va update PaymentStatus cua booking
  processPayment(req: Request, res: Response): void {
    const paymentData: ProcessPaymentRequest = req.body;

    if (!paymentData.bookingId || !paymentData.amount) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const insertPaymentQuery = `
      INSERT INTO Payments (BookingID, Amount, PaymentStatus) 
      VALUES (?, ?, 'completed')
    `;

    connection.execute(
      insertPaymentQuery,
      [paymentData.bookingId, paymentData.amount],
      (err, result: any) => {
        if (err) {
          console.error('Error processing payment:', err);
          res.status(500).json({ message: 'Error processing payment', error: err.message });
          return;
        }

        const updateBookingQuery = 'UPDATE Bookings SET PaymentStatus = ? WHERE BookingID = ?';
        connection.execute(updateBookingQuery, ['paid', paymentData.bookingId], (err) => {
          if (err) {
            console.error('Error updating booking payment status:', err);
            res.status(500).json({ message: 'Payment processed but failed to update booking', error: err.message });
            return;
          }

          res.status(200).json({
            message: 'Payment processed successfully',
            paymentId: result.insertId
          });
        });
      }
    );
  }

  // Lay thong tin payment theo BookingID
  getPaymentByBookingId(req: Request, res: Response): void {
    const { bookingId } = req.params;

    if (!bookingId) {
      res.status(400).json({ message: 'Missing booking ID' });
      return;
    }

    const query = 'SELECT * FROM Payments WHERE BookingID = ?';
    connection.execute(query, [bookingId], (err, results) => {
      if (err) {
        console.error('Error fetching payment:', err);
        res.status(500).json({ message: 'Error fetching payment', error: err.message });
        return;
      }

      if ((results as any).length === 0) {
        res.status(404).json({ message: 'No payment found for this booking' });
        return;
      }

      res.status(200).json((results as any)[0]);
    });
  }

  // Xoa booking hoan toan khoi database (Admin only)
  deleteBooking(req: Request, res: Response): void {
    const { bookingId } = req.body;

    if (!bookingId) {
      res.status(400).json({ message: 'Missing booking ID' });
      return;
    }

    const query = 'DELETE FROM Bookings WHERE BookingID = ?';
    connection.execute(query, [bookingId], (err, result: any) => {
      if (err) {
        console.error('Error deleting booking:', err);
        res.status(500).json({ message: 'Error deleting booking', error: err.message });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Booking not found' });
        return;
      }

      res.status(200).json({ message: 'Booking deleted successfully' });
    });
  }

  // Lay flights da dat cua user - JOIN voi Flights va Aircrafts de lay day du info
  getUserFlights(req: Request, res: Response): void {
    const { userID } = req.body;

    if (!userID) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const checkUserQuery = 'SELECT UserID FROM Users WHERE UserID = ?';
    connection.query(checkUserQuery, [userID], (err, userResults: any) => {
      if (err) {
        res.status(500).json({ message: 'Error checking user existence', error: err.message });
        return;
      }

      if (userResults.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const query = `
        SELECT 
          b.BookingID, b.BookingDate, b.BookingStatus, b.PaymentStatus, 
          f.FlightID, f.Departure, f.Arrival, f.DepartureTime, f.ArrivalTime, f.Price, f.SeatsAvailable, f.Status AS FlightStatus,
          a.Model AS AircraftModel
        FROM Bookings b
        JOIN Flights f ON b.FlightID = f.FlightID
        JOIN Aircrafts a ON f.AircraftTypeID = a.AircraftID
        WHERE b.UserID = ?
      `;

      connection.query(query, [userID], (err, results) => {
        if (err) {
          console.error('Error executing query:', err.stack);
          res.status(500).json({ message: 'Internal Server Error', error: err.message });
          return;
        }

        if ((results as any).length === 0) {
          res.status(404).json({ message: 'No booking found for this user' });
          return;
        }

        res.status(200).json(results);
      });
    });
  }

  // Xem va thong ke tat ca bookings voi thong tin chi tiet (Admin only)
  viewAndSummarizeBookings(req: Request, res: Response): void {
    const { userID } = req.body;

    if (!userID) {
      res.status(400).json({ message: 'UserID is required' });
      return;
    }

    const checkAdminQuery = 'SELECT Role FROM Users WHERE UserID = ?';
    connection.query(checkAdminQuery, [userID], (err, userResults: any) => {
      if (err) {
        res.status(500).json({
          message: 'Error checking user role',
          error: err.message,
        });
        return;
      }

      if (userResults.length === 0 || userResults[0].Role !== 'Admin') {
        res.status(403).json({
          message: 'Permission denied: User does not exist or is not an admin',
        });
        return;
      }

      const bookingQuery = `
        SELECT 
          b.BookingID, 
          b.UserID, 
          u.Name AS UserName, 
          b.BookingDate, 
          f.FlightID, 
          f.Departure, 
          f.Arrival, 
          f.DepartureTime, 
          f.ArrivalTime, 
          f.Price
        FROM Bookings b
        JOIN Users u ON b.UserID = u.UserID
        JOIN Flights f ON b.FlightID = f.FlightID
        ORDER BY b.BookingID DESC
      `;

      connection.query(bookingQuery, (err, results: any) => {
        if (err) {
          console.error('Error fetching booking statistics:', err);
          res.status(500).json({ message: 'Failed to fetch booking statistics' });
          return;
        }

        const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        res.status(200).json({
          message: 'Booking statistics retrieved successfully',
          totalBookings: results.length,
          bookings: results.map((booking: any) => ({
            BookingID: booking.BookingID,
            UserID: booking.UserID,
            UserName: booking.UserName,
            BookingDate: new Date(booking.BookingDate).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
            }),
            FlightID: booking.FlightID,
            Departure: booking.Departure,
            Arrival: booking.Arrival,
            DepartureTime: new Date(booking.DepartureTime).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
            }),
            ArrivalTime: new Date(booking.ArrivalTime).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
            }),
            Price: booking.Price,
          })),
        });
      });
    });
  }

  // Dat ve - logic phuc tap: kiem tra user, flight, booking trung, tao booking, giam ghe trong
  bookFlight(req: Request, res: Response): void {
    const { userID, flightID } = req.body;

    if (!userID || !flightID) {
      res.status(400).json({ message: 'Missing required fields: userID and flightID' });
      return;
    }

    const checkUserQuery = 'SELECT UserID FROM Users WHERE UserID = ?';
    connection.query(checkUserQuery, [userID], (err, userResults: any) => {
      if (err) {
        res.status(500).json({ message: 'Error checking user existence', error: err.message });
        return;
      }

      if (userResults.length === 0) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const checkFlightQuery = 'SELECT FlightID, SeatsAvailable FROM Flights WHERE FlightID = ?';
      connection.query(checkFlightQuery, [flightID], (err, flightResults: any) => {
        if (err) {
          res.status(500).json({ message: 'Error checking flight existence', error: err.message });
          return;
        }

        if (flightResults.length === 0) {
          res.status(404).json({ message: 'Flight not found' });
          return;
        }

        if (flightResults[0].SeatsAvailable <= 0) {
          res.status(400).json({ message: 'No seats available on this flight' });
          return;
        }

        const insertBookingQuery = `
          INSERT INTO Bookings (UserID, FlightID, BookingStatus, PaymentStatus) 
          VALUES (?, ?, 'confirmed', 'unpaid')
        `;

        connection.execute(insertBookingQuery, [userID, flightID], (err, result: any) => {
          if (err) {
            console.error('Error creating booking:', err);
            res.status(500).json({ message: 'Error creating booking', error: err.message });
            return;
          }

          const updateSeatsQuery = 'UPDATE Flights SET SeatsAvailable = SeatsAvailable - 1 WHERE FlightID = ?';
          connection.execute(updateSeatsQuery, [flightID], (err) => {
            if (err) {
              console.error('Error updating seats:', err);
            }

            res.status(201).json({
              message: 'Flight booked successfully',
              bookingId: result.insertId
            });
          });
        });
      });
    });
  }
}
