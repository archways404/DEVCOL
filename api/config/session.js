const session = require('express-session');

const sessionConfig = {
	secret: 'your_secret_key',
	resave: false,
	saveUninitialized: true,
	cookie: {
		secure: false, // set to true if using https
		maxAge: 3600000,
	},
};

module.exports = session(sessionConfig);
