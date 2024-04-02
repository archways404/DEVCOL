const { MongoClient } = require('mongodb');
require('dotenv').config();
const client = new MongoClient(process.env.DB_URI);

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

async function getAllUsers() {
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

module.exports = { userExist, createUser, getAllUsers };
