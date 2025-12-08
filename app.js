import express from 'express';
import cors from 'cors';
import errorHandler from './middlewares/error.handler.js';
import ErrorHandler from './utils/ErrorHandler.js';

// Import route files
import AuthRoutes from './routes/auth.routes.js';
import addressRoutes from './routes/address.routes.js';
import reviewRoutes from './routes/review.routes.js';
import userRoutes from './routes/user.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import bannerRoutes from './routes/banner.routes.js';
// import amdminRoutes from './routes/review.routes.js';
import plantRecognition from './routes/plant.recognition.routes.js';
import wishlist from './routes/user.products.routes.js';
import bookingsRouter from './routes/booking.routes.js';
import servicesRouter from './routes/services.routes.js';
import cartRoutes from './routes/cart.routes.js';
import serviceProviderRouter from './routes/service.provider.routes.js';

import morgan from 'morgan';
import logger from './utils/logger.js';
import { requestLogger } from './middlewares/request.logger.js';

const app = express();

// ============================================
// MIDDLEWARES
// ============================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(
	cors({
		origin:
			process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*',
		// methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
		credentials: true, // Allow credentials if needed
	})
);

// Morgan + Winston (for combined access logs)
app.use(
	morgan('dev', {
		stream: {
			write: (msg) => logger.info(msg.trim()),
		},
	})
);

// custom detailed logger
app.use(requestLogger);

// Security headers
// app.use(helmet());

// Logging
// if (process.env.NODE_ENV === 'development') {
// 	app.use(morgan('dev'));
// }

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
	res.status(200).json({
		success: true,
		message: 'Server is running',
		timestamp: new Date().toISOString(),
	});
});

// route middlewares - API routes
app.use('/api/auth', AuthRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/banners', bannerRoutes);
// app.use('/api/admin', amdminRoutes);
app.use('/api/ai', plantRecognition);
app.use('/api/user/', wishlist);
app.use('/api/bookings', bookingsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/service-providers', serviceProviderRouter);

// 404 handler
app.all(/.*/, (req, res, next) => {
	const path = req.path || req.originalUrl || 'unknown path';
	next(new ErrorHandler(`Can't find ${path} on this server`, 404));
});

// app.all('*', (req, res) => {
// 	res.status(404).json({
// 		success: false,
// 		message: `Route ${req.originalUrl} not found`,
// 	});
// });

// centralized error handling middleware
app.use(errorHandler);

export default app;
