/**
 * Offer Routes
 * 
 * Purpose: Define HTTP endpoints for offer operations
 * Routes match the original backend API structure for backward compatibility
 */

import { Router } from 'express';
import { OfferController } from '../controllers/OfferController';

const router = Router();
const offerController = new OfferController();

// Public routes (no authentication required)
/**
 * GET /GetAllOffers
 * Retrieve all offers for public display
 */
router.get('/GetAllOffers', offerController.getAllOffers.bind(offerController));

// Admin routes (require authentication)
/**
 * POST /CreateOffer
 * Create a new offer and send email notifications
 * Requires: { title, content, userID }
 */
router.post('/CreateOffer', offerController.createOffer.bind(offerController));

/**
 * POST /DeleteOffer
 * Delete an existing offer
 * Requires: { postID, UserID }
 */
router.post('/DeleteOffer', offerController.deleteOffer.bind(offerController));

export default router;