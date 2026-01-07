# PlantCo Backend API Documentation

## Overview

This is the backend service for the PlantCo application. It provides authentication and user management APIs using Node.js, Express, MongoDB, and Redis. This backend is one part of the overall PlantCo system; more APIs and features will be added as the project evolves.

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Redis (Upstash or local instance)
- (Optional) Gmail or SMTP credentials for email verification
- Twilio credentials for SMS/WhatsApp (if needed)

### Installation

1. Clone the repository and navigate to the backend folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file (see below for required variables).
4. Start MongoDB and Redis if running locally.
5. Start the server:
   ```bash
   npm run dev
   # or
   node server.js
   ```

---

## Environment Variables

Example `.env`:

```
PORT=8080
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development

SMTP_SERVICE=gmail
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_MAIL=your_gmail@gmail.com

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone

REDIS_URL=your_redis_url
```

---

## API Endpoints

### Auth Routes

Base URL: `/api/auth`

#### 1. Register (Sign Up)

- **POST** `/api/auth/signup`
- **Body:**
  ```json
  {
  	"username": "string",
  	"email": "string",
  	"password": "string"
  }
  ```
- **Response:**
  - On success:
    ```json
    {
    	"success": true,
    	"message": "Signup successful. Please verify the OTP sent to your email.",
    	"user": {
    		"_id": "string",
    		"username": "string",
    		"email": "string",
    		"isVerified": false,
    		"createdAt": "date"
    	}
    }
    ```
  - On failure:
    ```json
    {
    	"success": false,
    	"message": "Error message"
    }
    ```

#### 2. Verify OTP

- **POST** `/api/auth/verify-otp`
- **Body:**
  ```json
  {
  	"email": "string",
  	"otp": "string"
  }
  ```
- **Response:**
  - On success:
    ```json
    {
    	"success": true,
    	"message": "OTP verified successfully",
    	"token": "JWT",
    	"user": {
    		"_id": "string",
    		"username": "string",
    		"email": "string",
    		"isVerified": true,
    		"createdAt": "date"
    	}
    }
    ```
  - On failure:
    ```json
    {
    	"success": false,
    	"message": "Error message"
    }
    ```

#### 3. Resend OTP

- **POST** `/api/auth/resend-otp`
- **Body:**
  ```json
  {
  	"email": "string"
  }
  ```
- **Response:**
  - On success:
    ```json
    {
    	"success": true,
    	"message": "New OTP sent successfully, check your email!"
    }
    ```
  - On failure:
    ```json
    {
    	"success": false,
    	"message": "Error message"
    }
    ```

#### 4. Login

- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
  	"emailOrUsername": "string",
  	"password": "string"
  }
  ```
- **Response:**
  - On success:
    ```json
    {
    	"token": "JWT",
    	"user": {
    		"_id": "string",
    		"username": "string",
    		"email": "string",
    		"isVerified": true,
    		"createdAt": "date"
    	}
    }
    ```
  - On failure:
    ```json
    {
    	"success": false,
    	"message": "Error message"
    }
    ```

#### 5. Get Current User

- **GET** `/api/auth/me`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response:**
  - On success:
    ```json
    {
    	"user": {
    		"_id": "string",
    		"username": "string",
    		"email": "string",
    		"isVerified": true,
    		"createdAt": "date"
    	}
    }
    ```
  - On failure:
    ```json
    {
    	"success": false,
    	"message": "Error message"
    }
    ```

---

## User Model

- `username` (unique, required)
- `email` (unique, required)
- `password` (hashed, required)
- `isVerified` (boolean)
- `createdAt` (date)
- Other fields: `phoneNumber`, etc.

---

## Email Verification

- On registration, an OTP is sent to the user's email.
- User must verify OTP to activate their account.
- Email sending uses SMTP (Gmail or other, see `.env`).

---

## Redis Integration

- Redis is used for OTP storage and rate limiting.
- Ensure Redis is running and accessible via the `REDIS_URL` environment variable.
- The system gracefully handles Redis connection issues and retries.

---

## Error Handling

- Standardized error responses with status codes and messages.
- Validation errors return 400 status.
- Redis connection issues are logged and handled gracefully.

---

## For Frontend Developers

- Always handle error responses and display messages to users.
- Store JWT token securely (e.g., HttpOnly cookie or secure storage).
- Use the `/me` endpoint to fetch the current user after login/registration.
- More APIs (profile, plants, admin, etc.) will be added as the project grows.
- If you need a new endpoint, check with the backend team for the latest API contract.

---

## Contribution & Next Steps

- This backend currently covers authentication and basic user management.
- More features (profile, plant management, admin, etc.) will be added.
- Follow the existing structure for new routes/services.
- Keep code modular and use async/await for all DB operations.

---

## Contact

For questions or issues, contact the backend team.
