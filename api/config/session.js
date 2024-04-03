const session = require('express-session');

const sessionConfig = {
	secret: 'your_secret',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false, httpOnly: true }, // secure: true ensures cookies are sent over HTTPS
};

module.exports = session(sessionConfig);
