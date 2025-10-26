export interface Flight {
  FlightID: number;
  AircraftTypeID: number;
  Departure: string;
  Arrival: string;
  DepartureTime: Date;
  ArrivalTime: Date;
  Price: number;
  SeatsAvailable: number;
  Status: 'on-time' | 'delayed' | 'cancelled';
}

export interface Aircraft {
  AircraftID: number;
  Model: string;
  Manufacturer: string;
  Capacity: number;
  RangeKm: number;
  Description: string;
}

export interface CreateFlightRequest {
  aircraftTypeId: number;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  seatsAvailable: number;
}