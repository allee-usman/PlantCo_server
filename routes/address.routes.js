import express from 'express';
import * as addressController from '../controllers/address.controller.js';
import { isAuthenticated } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// Protected routes (require login)
router.use(isAuthenticated);

// add new address
router.post('/', addressController.addAddress);

// add an address to default
router.patch('/:addressId/default', addressController.setDefaultAddress);

// update an address
router.put('/:addressId', addressController.updateAddress);

// delete an address
router.delete('/:addressId', addressController.removeAddress);

// get all addresses
router.get('/', addressController.getAddresses);

// --- More specific GET routes first ---
router.get('/search/city', addressController.searchByCity);
router.get('/default', addressController.getDefaultAddress);
router.get('/label/:label', addressController.getAddressByLabel);

// --- Dynamic route last ---
router.get('/:addressId', addressController.getAddressById);

export default router;
