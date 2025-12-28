/*
1. GET /:userId/earnings?period={period}
Get earnings breakdown by month for selected period.

Query Parameters:
period: 6months | year | all

Response:
[
  { "month": "January", "amount": 12000 },
  { "month": "February", "amount": 15000 },
  { "month": "March", "amount": 13500 },
  { "month": "April", "amount": 14200 },
  { "month": "May", "amount": 16800 },
  { "month": "June", "amount": 15500 }
]

Example Controller:
exports.getEarnings = async (req, res) => {
  try {
    const { userId } = req.user.id;
    const { period = '6months' } = req.query;
    
    const months = period === '6months' ? 6 : period === 'year' ? 12 : 24;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const earnings = await Booking.aggregate([
      {
        $match: {
          providerId: userId,
          status: 'completed',
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' }
          },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formattedEarnings = earnings.map(e => ({
      month: getMonthName(e._id.month),
      amount: e.amount
    }));

    res.json(formattedEarnings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch earnings', error: error.message });
  }
};

*/
