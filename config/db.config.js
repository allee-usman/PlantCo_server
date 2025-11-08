import mongoose from 'mongoose';
import 'dotenv/config';

const connectMongoDB = async () => {
	try {
		const connectionInstance = await mongoose.connect(process.env.MONGODB_URI);
		console.log('✅ Connected to MongoDB: plantco');
	} catch (err) {
		console.log('MONGODB connection FAILED\n', err);
		process.exit(1);
	}
};

export { connectMongoDB };
