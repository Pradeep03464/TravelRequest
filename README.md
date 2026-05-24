# TravelRequest

A travel request web application with a Java Spring Boot backend and a React/Vite frontend.

## Project Structure

- `backend/` - Spring Boot backend service with authentication, travel request management, and file uploads.
- `frontend/` - React frontend built with Vite, Tailwind CSS, and JWT authentication.
- `jdk/` - Local JDK distribution excluded from GitHub; do not commit this directory.
- `TestCases/` - Excel test case files.

## Setup

### Backend

1. Install JDK 17 separately.
2. Open a terminal in `backend/`.
3. Run:
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend

1. Open a terminal in `frontend/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend:
   ```bash
   npm run dev
   ```

## Notes

- The `jdk/` folder is ignored to keep the GitHub repository under GitHub file size limits.
- If you need to run the backend, install a separate JDK 17 on your machine.
