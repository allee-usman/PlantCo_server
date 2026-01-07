// models/earning.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const EarningSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // only vendor/service_provider (stored in User)

		month: {
			type: String,
		},
		year: {
			type: String,
		},
		amount: {
			type: Number,
		},
		bookingsCount: {
			type: Number,
		},
	},
	{ timestamps: true }
);

// index to speed up provider schedule queries and overlapping checks
EarningSchema.index({
	provider: 1,
	'deails.scheduledAt': 1,
});
EarningSchema.index({ userId: 1 });

export const Earning = mongoose.model('Earning', EarningSchema);
export default Earning;
