import { Router } from 'express';
import { FlightController } from '../controllers/FlightController';

const router = Router();
const flightController = new FlightController();

// Flight routes - match voi cac methods co san trong FlightController
router.get('/GetAllFlights', flightController.getAllFlights.bind(flightController));
router.post('/SearchFlight', flightController.searchFlights.bind(flightController));
router.post('/Add', flightController.createFlight.bind(flightController));
router.post('/Delete', flightController.deleteFlight.bind(flightController));
router.put('/status', flightController.updateFlightStatus.bind(flightController));

export default router;