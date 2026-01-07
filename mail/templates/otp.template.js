export const generateOTPTemplate = (otp) => {
	return `
    <div
			style="
				font-family: Arial, sans-serif;
				background-color: #f7f7ff;
				padding: 24px;
			"
		>
			<div
				style="
					max-width: 480px;
					margin: auto;
					background: #ffffff;
					border-radius: 12px;
					overflow: hidden;
					box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
				"
			>
				<!-- Header -->
				<div
					style="background-color: #6cc51d; padding: 16px; text-align: center"
				>
					<h1 style="margin: 0; color: #ffffff; font-size: 1.5em">
						🌱 PlantCo
					</h1>
				</div>

				<!-- Body -->
				<div style="padding: 24px; text-align: center">
					<h2 style="color: #172505; margin-top: 0">
						Verify Your Email Address
					</h2>
					<p style="color: #1c2d06; font-size: 1em; margin-bottom: 20px">
						Use the OTP below to complete your verification process:
					</p>

					<!-- OTP Box -->
					<div
						style="
							font-size: 2em;
							font-weight: bold;
							letter-spacing: 6px;
							margin: 20px auto;
							padding: 18px 24px;
							border-radius: 10px;
							display: inline-block;
							background: linear-gradient(135deg, #6cc51d, #01c38d);
							color: #fff;
							box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
						"
					>
						${otp}
					</div>

					<p style="color: #6b7280; font-size: 0.9em; margin-top: 20px">
						⏳ This code will expire in <strong>5 minutes</strong>. Please do
						not share it with anyone.
					</p>

					<p style="color: #9ca3af; font-size: 0.85em; margin-top: 12px">
						If you did not request this code, please ignore this email.
					</p>
				</div>

				<!-- Footer -->
				<div
					style="
						background-color: #f8fde8;
						padding: 16px;
						text-align: center;
						font-size: 0.85em;
						color: #4d7111;
					"
				>
					<p style="margin: 0">
						&copy; ${new Date().getFullYear()} PlantCo. All rights reserved.
					</p>
				</div>
			</div>
		</div>
  `;
};
