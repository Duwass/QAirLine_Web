// Controller quan ly flights va aircrafts
import { Request, Response } from 'express';
import connection from '../database/database';
import { Flight, CreateFlightRequest } from '../types/flight';

export class FlightController {
    // Lay tat ca flights (public - guest co the xem)
  getAllFlights(req: Request, res: Response): void {
    const query = 'SELECT * FROM Flights';
    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error executing query:', err.stack);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
        return;
      }

      if ((results as any).length === 0) {
        res.status(404).json({ message: 'No flights found' });
        return;
      }

      res.status(200).json(results);
    });
  }

  // Tao flight moi (Admin only)
  createFlight(req: Request, res: Response): void {
    const flightData: CreateFlightRequest = req.body;

    const query = `
      INSERT INTO Flights 
      (AircraftTypeID, Departure, Arrival, DepartureTime, ArrivalTime, Price, SeatsAvailable) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.execute(
      query,
      [
        flightData.aircraftTypeId,
        flightData.departure,
        flightData.arrival,
        flightData.departureTime,
        flightData.arrivalTime,
        flightData.price,
        flightData.seatsAvailable
      ],
      (err, result: any) => {
        if (err) {
          console.error('Error creating flight:', err);
          res.status(500).json({ message: 'Error creating flight', error: err.message });
          return;
        }

        res.status(201).json({
          message: 'Flight created successfully',
          flightId: result.insertId
        });
      }
    );
  }

  // Cap nhat status cua flight (Admin only)
  updateFlightStatus(req: Request, res: Response): void {
    const { flightId, status } = req.body;

    if (!flightId || !status) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const query = 'UPDATE Flights SET Status = ? WHERE FlightID = ?';
    connection.execute(query, [status, flightId], (err, result: any) => {
      if (err) {
        console.error('Error updating flight status:', err);
        res.status(500).json({ message: 'Error updating flight status', error: err.message });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Flight not found' });
        return;
      }

      res.status(200).json({ message: 'Flight status updated successfully' });
    });
  }

  // Xoa flight (Admin only)
  deleteFlight(req: Request, res: Response): void {
    const { flightId } = req.body;

    if (!flightId) {
      res.status(400).json({ message: 'Missing flight ID' });
      return;
    }

    const query = 'DELETE FROM Flights WHERE FlightID = ?';
    connection.execute(query, [flightId], (err, result: any) => {
      if (err) {
        console.error('Error deleting flight:', err);
        res.status(500).json({ message: 'Error deleting flight', error: err.message });
        return;
      }

      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Flight not found' });
        return;
      }

      res.status(200).json({ message: 'Flight deleted successfully' });
    });
  }

  // Tim flight theo departure va arrival (public - user va guest dung)
  searchFlights(req: Request, res: Response): void {
    const { departure, arrival } = req.body;

    if (!departure || !arrival) {
      res.status(400).json({ message: 'Missing search parameters' });
      return;
    }

    const query = 'SELECT * FROM Flights WHERE Departure = ? AND Arrival = ?';
    connection.execute(query, [departure, arrival], (err, results) => {
      if (err) {
        console.error('Error searching flights:', err);
        res.status(500).json({ message: 'Error searching flights', error: err.message });
        return;
      }

      if ((results as any).length === 0) {
        res.status(404).json({ message: 'No flights found for the given route' });
        return;
      }

      res.status(200).json(results);
    });
  }
}
