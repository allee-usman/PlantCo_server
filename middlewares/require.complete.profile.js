// middlewares/requireCompleteProfile.js
export const requireCompleteProfile = (req, res, next) => {
	// Skip for customers (they don't need profile completion)
	if (req.user.role === 'customer') {
		return next();
	}

	if (!req.user.profileCompletion.isComplete) {
		const validation = req.user.validateProfileCompletion();

		return res.status(403).json({
			success: false,
			message: 'Please complete your profile to access this feature',
			profileCompletion: {
				percentage: req.user.profileCompletion.percentage,
				isComplete: false,
				missingFields: validation.errors,
			},
			redirectTo: '/api/users/profile/complete',
		});
	}

	next();
};

// ===== USAGE IN ROUTES =====

/*
// Protected routes that need complete profile
router.post('/products', 
    authenticate, 
    requireCompleteProfile,  // ✅ Only vendors with complete profiles
    createProduct
);

router.post('/bookings/:id/accept', 
    authenticate, 
    requireCompleteProfile,  // ✅ Only service providers with complete profiles
    acceptBooking
);

// Profile completion endpoint (no restriction)
router.patch('/users/profile/complete', 
    authenticate,  // ✅ Any authenticated user can complete profile
    completeProfile
);
*/
