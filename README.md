
# Campus Gate Pass Management System

A modern web application for managing student gate passes in educational institutions. Built with React, Express, and PostgreSQL.

## Features

- **Multi-User Roles**: Support for Students, Wardens, and Security Guards
- **Digital Gate Pass Management**: Create, approve, and verify gate passes
- **Real-time Notifications**: Get instant updates on pass status
- **Profile Management**: Upload profile photos and manage user information
- **Secure Authentication**: Role-based access control

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based auth with Express-session

#OUTLOOK LINK (VIDEO+REPORT):https://krmangalameduin-my.sharepoint.com/:f:/g/personal/2301730125_krmu_edu_in/Ei76C39fiOdIhJ2FTdNu-oQBZ3VP532W8xHl2khg2RujEQ?e=HQPLGm

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## User Roles & Features

### Students
- Create gate pass requests
- View pass history
- Receive notifications
- Update profile

### Wardens
- Review gate pass requests
- Approve/Reject passes
- View student details
- Manage notifications

### Security Guards
- Verify gate passes
- View pass details
- Mark entry/exit

## API Endpoints

- `/api/auth/*` - Authentication routes
- `/api/passes/*` - Gate pass management
- `/api/users/*` - User management
- `/api/notifications/*` - Notification system

## Environment Setup

The application uses PostgreSQL for data storage. Make sure to set up your database connection in the environment variables.

## Contributing

Feel free to open issues and pull requests for any improvements.

## License

MIT License
