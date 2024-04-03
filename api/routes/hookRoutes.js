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

  const ref = req.body.ref; // The branch that was pushed to
	const isMerged = req.body.pull_request && req.body.pull_request.merged;

	if (ref === 'refs/heads/main' && isMerged) {
		exec(`git pull && npm install`, (error, stdout, stderr) => {
			if (error) {
				console.error(`exec error: ${error}`);
				return res.status(500).send('Server Error');
			}

			console.log(`stdout: ${stdout}`);
			console.error(`stderr: ${stderr}`);

			res.status(200).send('Updated successfully');

			// Use a process manager to restart the server
		});
	} else {
		console.log('Not a merge to the main branch, skipping.');
		return res.status(200).send('Not a merge to the main branch, skipping.');
	}
});

module.exports = router;
