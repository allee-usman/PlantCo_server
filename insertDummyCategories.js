import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './models/category.model.js'; // adjust path as per your structure
import slugify from 'slugify';

dotenv.config();

const ADMIN_ID = new mongoose.Types.ObjectId('68d9320a3033564b9b7c5d8d');

// MongoDB connection
const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('MongoDB connected...');
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
};

// Sample categories for PlantCo
const categories = [
	{
		name: 'Plants',
		children: [
			{ name: 'Indoor Plants' },
			{ name: 'Outdoor Plants' },
			{ name: 'Succulents & Cactus' },
			{ name: 'Flowering Plants' },
			{ name: 'Herbs & Medicinal Plants' },
		],
	},
	{
		name: 'Gardening Supplies',
		children: [
			{ name: 'Pots & Planters' },
			{ name: 'Soil & Fertilizers' },
			{ name: 'Seeds' },
			{ name: 'Gardening Tools' },
		],
	},
	{
		name: 'Decor',
		children: [
			{ name: 'Terrariums' },
			{ name: 'Artificial Plants' },
			{ name: 'Pebbles & Stones' },
			{ name: 'Garden Lights' },
		],
	},
	{
		name: 'Services',
		children: [
			{ name: 'Landscaping' },
			{ name: 'Plant Maintenance' },
			{ name: 'Custom Gardening' },
		],
	},
];

const seedCategories = async () => {
	try {
		await Category.deleteMany({});
		console.log('Old categories removed.');

		for (let cat of categories) {
			// Create parent
			const parentCategory = await Category.create({
				name: cat.name,
				slug: slugify(cat.name, { lower: true }),
				image: {
					url: 'https://via.placeholder.com/300',
					public_id: 'placeholder',
				},
				createdBy: ADMIN_ID,
			});

			// Create children
			for (let child of cat.children) {
				await Category.create({
					name: child.name,
					slug: slugify(child.name, { lower: true }),
					parent: parentCategory._id,
					image: {
						url: 'https://via.placeholder.com/300',
						public_id: 'placeholder',
					},
					createdBy: ADMIN_ID,
				});
			}
		}

		console.log('Categories seeded successfully!');
		process.exit();
	} catch (err) {
		console.error('Error seeding categories:', err);
		process.exit(1);
	}
};

connectDB().then(seedCategories);
