import { useState, useEffect } from 'react';

function App() {
	const [userData, setUserData] = useState(null);

	useEffect(() => {
		fetch('http://localhost:3000/api/userdata', {
			method: 'GET',
			credentials: 'include',
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				return response.json();
			})
			.then((data) => {
				setUserData(data.user);
			})
			.catch((error) => {
				console.error('Error fetching user data:', error);
			});
	}, []);

	const handleLogin = () => {
		window.location.assign('http://localhost:3000/auth/github');
	};

	const handleLogout = () => {
		fetch('http://localhost:3000/logout', { credentials: 'include' })
			.then((response) => {
				if (response.ok) {
					setUserData(null);
					// Optionally, redirect to the home page or refresh
					//window.location.href = 'http://localhost:5173/';
				} else {
					console.error('Logout failed');
				}
			})
			.catch((error) => {
				console.error('Error during logout:', error);
			});
	};

	return (
		<>
			{userData ? (
				<div>
					<p>ID: {userData.id}</p>
					<p>username: {userData.username}</p>
					<p>
						Profile URL:{' '}
						<a
							href={userData.profileUrl}
							target="_blank"
							rel="noopener noreferrer">
							{userData.profileUrl}
						</a>
					</p>
					{userData.photos && userData.photos.length > 0 && (
						<img
							src={userData.photos[0].value}
							alt="User avatar"
						/>
					)}
					<button onClick={handleLogout}>Logout</button>
				</div>
			) : (
				<button onClick={handleLogin}>Sign in with GitHub</button>
			)}
		</>
	);
}

export default App;
