const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
require('dotenv').config();

passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID,
			clientSecret: process.env.GITHUB_CLIENT_SECRET,
			callbackURL: 'http://localhost:3000/auth/github/callback',
		},
		function (accessToken, refreshToken, profile, cb) {
			// Here, you would find or create a user in your database
			return cb(null, profile);
		}
	)
);

passport.serializeUser(function (user, cb) {
	cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
	cb(null, obj);
});

module.exports = passport;
