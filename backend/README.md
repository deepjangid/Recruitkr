# Recruitkr Backend (Node.js + MongoDB)

Secure backend API for your React app with:
- MongoDB + Mongoose
- JWT access + refresh tokens (rotation)
- Argon2id password hashing + app pepper
- Rate limiting (global, auth, contact)
- Helmet, CORS, body-size limits, NoSQL injection protection, HPP
- Zod request validation
- Role-based authorization (`candidate`, `client`, `admin`)

## 1. Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## 2. Environment Variables

Use `.env.example` as template:
- `MONGODB_URI`
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (64+ chars)
- `BCRYPT_OR_ARGON2_PEPPER` (random secret)
- `CORS_ORIGIN` (frontend URL, comma-separated if multiple)
- `FRONTEND_URL` (used to generate password reset link)
- SMTP (for password reset emails): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM`

## 3. Base URL

`/api/v1`

## 4. API Endpoints

### Health
- `GET /health`

### Auth
- `POST /auth/register/candidate`
- `POST /auth/register/client`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/change-password` (auth required)
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Users/Profile
- `GET /users/me` (auth required)
- `GET /users/candidate/me` (candidate)
- `GET /users/client/me` (client)

### Resumes
- `POST /resumes/parse` (public, multipart file field: `resume`)
- `GET /resumes/mine` (candidate, download stored resume)

### Jobs & Applications
- `GET /jobs` (public list/search jobs)
- `POST /jobs` (client)
- `GET /jobs/mine` (client)
- `PATCH /jobs/:jobId/status` (client)
- `POST /jobs/apply` (candidate)
- `GET /jobs/applications/mine` (candidate)
- `GET /jobs/applications` (client)
- `PATCH /jobs/applications/:applicationId/status` (client)

### Dashboards
- `GET /dashboards/candidate` (candidate)
- `GET /dashboards/client` (client)

### Contact
- `POST /contact`

## 5. Request Examples

### Candidate registration
```json
{
  "email": "candidate@example.com",
  "mobile": "9876543210",
  "password": "Strong@123",
  "fullName": "Rahul Sharma",
  "dateOfBirth": "1995-01-15",
  "gender": "Male",
  "address": "Jaipur, Rajasthan",
  "pincode": "302001",
  "highestQualification": "B.Tech / BE",
  "experienceStatus": "experienced",
  "experienceDetails": {
    "currentCompany": "TechCorp India",
    "designation": "Software Engineer",
    "totalExperience": "4 Years",
    "industry": "IT",
    "currentCtcLpa": 8,
    "expectedCtcLpa": 12,
    "minimumCtcLpa": 10,
    "noticePeriod": "30 Days"
  },
  "preferences": {
    "preferredLocation": "Jaipur, Remote",
    "preferredIndustry": "IT",
    "preferredRole": "Senior Developer",
    "workModes": ["On-site", "Hybrid"]
  },
  "declarationAccepted": true,
  "representationAuthorized": true,
  "resume": {
    "fileName": "resume.pdf",
    "mimeType": "application/pdf",
    "dataBase64": "...."
  }
}
```

If `resume` is omitted in candidate registration:
- backend generates a PDF resume from submitted form values
- adds watermark at bottom: `Created by RecruitKr`
- stores it in MongoDB
- returns it as base64 in response (`data.generatedResume`) for automatic frontend download

### Client registration
```json
{
  "email": "hr@techcorp.in",
  "mobile": "9001965072",
  "password": "Strong@123",
  "companyName": "TechCorp India",
  "industry": "Information Technology",
  "companyWebsite": "https://techcorp.in",
  "companySize": "201-500 Employees",
  "companyType": "Private Limited",
  "spoc": {
    "name": "Anita Mehra",
    "designation": "HR Director",
    "mobile": "9001965072",
    "email": "hr@techcorp.in"
  },
  "commercial": {
    "recruitmentModel": "Success-Based",
    "replacementPeriod": "90 Days",
    "paymentTerms": "30 Days from Joining"
  },
  "billing": {
    "billingCompanyName": "TechCorp India Pvt Ltd",
    "gstNumber": "27AAECT1234F1Z5",
    "billingAddress": "Mumbai, Maharashtra",
    "billingEmail": "billing@techcorp.in"
  },
  "declarationAccepted": true
}
```

### Login
```json
{
  "email": "candidate@example.com",
  "password": "Strong@123",
  "role": "candidate"
}
```

## 6. Frontend Integration Notes

- Set frontend env `VITE_API_URL=http://localhost:5000/api/v1`
- Store `accessToken` in memory (React state/query cache), not localStorage when possible.
- Send refresh token using secure HTTP-only cookie, or include `refreshToken` in body for non-browser clients.
- Add `Authorization: Bearer <accessToken>` for protected APIs.
- Call `/auth/refresh` on `401` and retry once.

For production deployments:
- frontend must be built with `VITE_API_URL=https://your-backend-domain/api/v1` if backend and frontend use different domains
- backend `CORS_ORIGIN` must include the deployed frontend origin, for example `https://your-frontend.vercel.app`
- verify backend is live at `GET /api/v1/health` before testing the frontend

## 7. Security Features Included

- Argon2id password hashing
- Refresh token rotation with token hash storage
- Account lock after repeated failed logins
- Strict schema validation on every input
- NoSQL injection and HTTP parameter pollution protection
- Rate limiting at route and global levels
- Minimal JSON body size (`100kb`)
- Role-based access control
