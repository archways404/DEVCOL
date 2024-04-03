// TOP LEVEL IMPORTS
const { MongoClient } = require('mongodb');
const express = require('express');
const passport = require('./config/passport');
const session = require('./config/session');
const authRoutes = require('./routes/authRoutes');
const hookRoutes = require('./routes/hookRoutes');

const app = express();

// .ENV VARIABLES
require('dotenv').config();

// MONGODB CONNECTION
const client = new MongoClient(process.env.DB_URI);

// MIDDLEWARE
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());

app.use(authRoutes);
app.use(hookRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
