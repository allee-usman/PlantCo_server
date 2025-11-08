// services/notification.service.js
import { sendEmail } from '../mail/send.email.js';
import User from '../models/user.model.js';
import ErrorHandler from '../utils/ErrorHandler.js';

export const sendUserEmail = async (userId, type, subject, htmlTemplate) => {
	const user = await User.findById(userId).select('email notifications');

	if (!user) throw new ErrorHandler('User not found', 404);

	const { notifications } = user;

	// Master switch
	if (!notifications.enableNotifications)
		return { skipped: true, reason: 'Notifications disabled' };

	// Type-based switch
	switch (type) {
		case 'order':
			if (!notifications.orderAlerts)
				return { skipped: true, reason: 'Order alerts disabled' };
			break;
		case 'general':
			if (!notifications.generalAlerts)
				return { skipped: true, reason: 'General alerts disabled' };
			break;
		case 'email':
		default:
			if (!notifications.emailAlerts)
				return { skipped: true, reason: 'Email alerts disabled' };
			break;
	}

	// ✅ Only now actually send
	await sendEmail(user.email, subject, htmlTemplate);

	return { success: true, message: 'Email sent' };
};

/**
 Example usage in an order flow:

 import { sendUserEmail } from '../services/notification.service.js';
import { generateOrderTemplate } from '../mail/templates/order.template.js';

await sendUserEmail(
  order.userId,
  'order',
  'Your order has been placed!',
  generateOrderTemplate(order)
);


https://chatgpt.com/s/t_68d7b69cc6dc8191808d6fec119149e4
 */
