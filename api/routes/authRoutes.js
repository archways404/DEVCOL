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
		res.redirect('/');
	}
);

router.get('/logout', function (req, res, next) {
	req.logout(function (err) {
		if (err) {
			return next(err);
		}
		req.session.destroy(function (err) {
			if (err) {
				console.log(
					'Error : Failed to destroy the session during logout.',
					err
				);
			}
			res.redirect('/');
		});
	});
});

module.exports = router;
