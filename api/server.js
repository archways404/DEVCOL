// TOP LEVEL IMPORTS
const { MongoClient } = require('mongodb');
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const session = require('./config/session');
const authRoutes = require('./routes/authRoutes');
const hookRoutes = require('./routes/hookRoutes');

// .ENV VARIABLES
require('dotenv').config();

const app = express();

app.use(
	cors({
		origin: 'http://localhost:5173', // or wherever your frontend is hosted
		credentials: true, // to support credentials like cookies
	})
);

// MONGODB CONNECTION
const client = new MongoClient(process.env.DB_URI);

// MIDDLEWARE
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

// ROUTES
app.use(authRoutes);
app.use(hookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
