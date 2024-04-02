const { MongoClient } = require('mongodb');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

const { userExist, createUser } = require('./components/db');

require('dotenv').config();

const client = new MongoClient(process.env.DB_URI);

async function run() {
	try {
		await client.connect();
		console.log('Connected to the database');

		const database = client.db('userData');
		const useridCollection = database.collection('useridGithub');
		// Pass an empty query object to find all documents
		const cursor = useridCollection.find({});
		// Convert the cursor to an array to retrieve all documents
		const users = await cursor.toArray();
		// Log each userid
		users.forEach((user) => console.log(user.userid));
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}
run().catch(console.dir);

// Create Express app
const app = express();

/// Configure the GitHub Strategy for Passport
passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID, // Your GitHub app client ID
			clientSecret: process.env.GITHUB_CLIENT_SECRET, // Your GitHub app client secret
			callbackURL: 'http://localhost:3000/auth/github/callback',
		},
		function (accessToken, refreshToken, profile, cb) {
			// Here, you would find or create a user in your database
			// For simplicity, we'll just return the GitHub profile
			return cb(null, profile);
		}
	)
);

// Configure Passport authenticated session persistence.
passport.serializeUser(function (user, cb) {
	cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
	cb(null, obj);
});

// Use express-session middleware for session handling
app.use(
	session({
		secret: 'your_secret_key',
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: false, // set to true if using https
			maxAge: 3600000, // set to true if using https
		},
	})
);

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

// Route to start the GitHub authentication process
app.get('/auth/github', passport.authenticate('github'));

// Route to handle the callback after GitHub has authenticated the user
app.get(
	'/auth/github/callback',
	passport.authenticate('github', { failureRedirect: '/login' }),
	async function (req, res) {
		// Successful authentication, redirect home.
		const user = await userExist(req.user.id);
		if (!user) {
			console.log('User does not exist, creating user');
			await createUser(req.user.id);
		} else {
			console.log('User exists');
		}
		res.redirect('/');
	}
);

// Define a logout route
app.get('/logout', function (req, res) {
	// Passport's logout function to clear the authentication
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		// Destroy the session data
		req.session.destroy(function (err) {
			if (err) {
				console.log(
					'Error : Failed to destroy the session during logout.',
					err
				);
			}
			// The response should occur within this callback to ensure the session is destroyed prior to redirecting
			res.redirect('/');
		});
	});
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
