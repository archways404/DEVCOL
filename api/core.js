const { MongoClient } = require('mongodb');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

require('dotenv').config();

const client = new MongoClient(process.env.DB_URI);

async function run() {
	try {
		await client.connect();
		console.log('Connected to the database');

		const database = client.db('userData');
		const userid = database.collection('userid-github');
		const query = { userid: 'test2' };
		const test = await userid.findOne(query);
		console.log(test);
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}
run().catch(console.dir);

async function userExist(github_userid) {
	try {
		await client.connect();
		console.log('Connected to the database');
		const database = client.db('userData');
		const useridCollection = database.collection('useridGithub');
		const query = { userid: github_userid };
		const user = await useridCollection.findOne(query);
		console.log(user);
		return user; // Return the found user or null
	} catch (error) {
		console.error('Error in userExist:', error);
	} finally {
		// Consider whether you need to close the connection here
	}
}

async function createUser(github_userid) {
	try {
		await client.connect();
		console.log('Connected to the database');
		const database = client.db('userData');
		const userid = database.collection('useridGithub');
		const newUser = { userid: github_userid };
		const result = await userid.insertOne(newUser);
		console.log(
			`New listing created with the following id: ${result.insertedId}`
		);
		const userCollection = database.collection('userCollection');
		const newCollection = { userid: github_userid };
		const response = await userCollection.insertOne(newCollection);
		console.log(
			`New listing created with the following id: ${response.insertedId}`
		);
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}

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
		cookie: { secure: false }, // set to true if using https
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
	req.logout();
	res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
