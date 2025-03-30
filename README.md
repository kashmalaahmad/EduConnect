# EduConnect

A tutoring platform connecting students with tutors.

## Features

- User authentication (Student/Tutor/Admin)
- Tutor profile management
- Session booking system
- Real-time notifications
- Admin dashboard
- Payment integration
- Review system

## Installation

1. Clone the repository
```bash
git clone https://github.com/kashmalaahmad/EduConnect.git
```

2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Set up environment variables
- Create `.env` file in server directory
- Add required environment variables

4. Run the application
```bash
# Run server (from server directory)
npm run dev

# Run client (from client directory)
npm start
```

## Environment Variables

Create a `.env` file in the server directory with these variables:

```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

## Tech Stack

- Frontend: React, TailwindCSS
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT

## Contributing

Pull requests are welcome.

## License

MIT

