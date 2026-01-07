import nodemailer from 'nodemailer';

export const sendEmail = async (to, subject, htmltemplate) => {
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		service: process.env.SMTP_SERVICE,
		port: process.env.SMTP_PORT,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	const options = {
		from: process.env.SMTP_USER,
		to,
		subject,
		html: htmltemplate,
	};
	try {
		await transporter.sendMail(options);
	} catch (err) {
		console.error('Nodemailer error:', err);
		throw err;
	}
};
