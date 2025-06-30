# Authentication

**A FastAPI-Based Authentication System**

## Overview
This repository implements a robust authentication system using FastAPI and MongoDB. It supports three types of authentication:
- **Email and Password**
- **Username and Password**
- **Phone Number and Password**

The system securely hashes passwords before storing them in the database, ensuring the confidentiality of user credentials.

---

## Features
- **Multiple Authentication Methods**: Choose between email, username, or phone number for authentication.
- **Secure Password Handling**: Implements password hashing using industry-standard algorithms.
- **Fast and Scalable**: Built with FastAPI for high performance and scalability.
- **MongoDB Integration**: Stores user credentials and data in a reliable NoSQL database.

---

## Technology Stack
- **Backend Framework**: FastAPI
- **Database**: MongoDB
- **Password Hashing**: [bcrypt or any other hashing library used]
- **Programming Language**: Python

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Auth.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Auth
   ```
3. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Set up MongoDB:
   - Install MongoDB and start the service.
   - Configure the MongoDB URI in the `.env` file.

6. Set up .env:
- SECRET_KEY = "YOUR_SECRET_KEY"
- ALGORITHM = "YOUR_ALGORITHM"
- ACCESS_TOKEN_EXPIRE_MINUTES = "30" 
- REFRESH_TOKEN_EXPIRE_DAYS = "7"
- GOOGLE_CLIENT_SECRET = "YOUR_GOOGLE_CLIENT_SECRET"
- GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"
- SESSION_SECRET_KEY = "YOUR_SESSION_SECRET_KEY"
- AWS_ACCESS_KEY_ID = "YOUR_AWS_ACCESS_KEY_ID"
- AWS_SECRET_ACCESS_KEY = "YOUR_AWS_SECRET_ACCESS_KEY"
- AWS_REGION = "YOUR_AWS_REGION"
- NO_REPLY_EMAIL = "YOUR_NO_REPLY_EMAIL"
- ACCOUNT_SID = "YOUR_TWILIO_ACCOUNT_SID"
- AUTH_TOKEN = "YOUR_TWILIO_AUTH_TOKEN"
---

## Usage

1. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
2. Access the API documentation at:
   ```
   http://127.0.0.1:8000/docs
   ```
3. Use the API to register, log in, and manage users with email-password, username-password, or phone number-password combinations.

---

## API Endpoints

### Authentication Endpoints
- **POST /signup**: Register a new user.
- **POST /login**: Log in an existing user.

---

## Project Structure

```plaintext
Auth/
├── .dockerignore
├── .env
├── .gitignore  # gitignore file for GitHub
├── Dockerfile
├── README.md  # Project documentation
├── __init__.py  # initializes package
├── app.py  # main FastAPI app
├── authentication
│   ├── __init__.py  # initializes package
│   ├── config
│   │   ├── __init__.py  # initializes package
│   │   ├── bloom_filter.py
│   │   ├── celery_app.py
│   │   ├── database.py
│   │   ├── kafka1_config.py
│   │   ├── kafka2_config.py
│   │   ├── kafka3_config.py
│   │   ├── rate_limiting.py
│   │   └── redis_config.py
│   ├── fake_doctor.py
│   ├── fake_patient.py
│   ├── helper
│   │   ├── __init__.py  # initializes package
│   │   ├── auth_token.py
│   │   ├── hashing.py
│   │   ├── oauth2.py
│   │   └── utils.py
│   ├── models
│   │   ├── __init__.py  # initializes package
│   │   └── models.py  # models
│   ├── otp_service
│   │   ├── __init__.py  # initializes package
│   │   ├── otp_verify.py
│   │   └── send_mail.py
│   ├── src
│   │   ├── __init__.py  # initializes package
│   │   ├── auth_user.py
│   │   └── google_auth.py
│   └── templates
│       ├── create_new_password.html
│       ├── doctor.html
│       ├── doctor_signup.html
│       ├── google_login.html
│       ├── index.html
│       ├── login.html
│       ├── otp.html
│       ├── patient.html
│       ├── patient_login.html
│       ├── phone_number.html
│       ├── reset_password.html
│       ├── signup.html
│       └── success.html
├── credentials.json
├── docker-compose.yml
├── requirements.txt
├── run.sh
├── test_api
│   ├── __init__.py  # initializes package
│   ├── doctor_hit_api.py
│   ├── locust.py
│   ├── patient_api_hit.py
│   └── test_login.py
└── token.pickle
```

---

## Future Enhancements
- Add support for two-factor authentication (2FA).
- Implement OAuth2 for social login (e.g., Google, Facebook).
- Enhance rate-limiting for login attempts to prevent brute-force attacks.

---

## Contribution Guidelines

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Commit your changes and submit a pull request.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Author
**Your Username**  
[GitHub](https://github.com/your-username) | [Medium](https://medium.com/@your-username)

---
