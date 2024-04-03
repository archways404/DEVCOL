const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const router = express.Router();

require('dotenv').config();

router.post('/webhook', (req, res) => {
	const signature = `sha256=${crypto
		.createHmac('sha256', process.env.WEBHOOK_SECRET)
		.update(JSON.stringify(req.body))
		.digest('hex')}`;

	if (req.headers['x-hub-signature-256'] !== signature) {
		return res.status(401).send('Mismatched signatures');
	}

	exec(
		`cd ${process.env.REPO_PATH} && git pull && npm install`,
		(error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return res.status(500).send('Server Error');
			}

			console.log(`stdout: ${stdout}`);
			console.error(`stderr: ${stderr}`);

			res.status(200).send('Updated successfully');

			// Use a process manager to restart the server
		}
	);
});

module.exports = router;
