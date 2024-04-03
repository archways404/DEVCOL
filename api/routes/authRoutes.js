const express = require('express');
const passport = require('../config/passport');
const { userExist, createUser, getAllUsers } = require('../database/db');
const router = express.Router();

router.get('/auth/github', passport.authenticate('github'));

router.get(
	'/auth/github/callback',
	passport.authenticate('github', { failureRedirect: '/login' }),
	async (req, res) => {
		const user = await userExist(req.user.id);
		if (!user) {
			console.log('User does not exist, creating user');
			await createUser(req.user.id);
		} else {
			console.log('User exists');
		}

		console.log(req.session); // Check if the session is set

		res.redirect('http://localhost:5173/');
	}
);

router.get('/logout', function (req, res) {
	req.logout(function (err) {
		if (err) {
			console.error('Error during logout:', err);
			return res.status(500).send('Error during logout');
		}
		req.session.destroy(function (err) {
			if (err) {
				console.error('Error destroying session:', err);
				return res.status(500).send('Error destroying session');
			}
			res.clearCookie('connect.sid'); // Clear the session cookie
			res.status(200).send('Logged out');
		});
	});
});

router.get('/api/userdata', (req, res) => {
	console.log('Authenticated:', req.isAuthenticated());
	console.log('User:', req.user);

	if (req.isAuthenticated()) {
		res.json({ user: req.user });
	} else {
		res.status(401).send('User not authenticated');
	}
});

module.exports = router;
