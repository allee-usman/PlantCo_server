import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as userServices from '../../services/user.services.js';

export const deleteAccount = catchAsyncError(async (req, res) => {
	await userServices.deleteAccount(req.user.id);
	res.json({ success: true, message: 'Account deleted successfully' });
});
