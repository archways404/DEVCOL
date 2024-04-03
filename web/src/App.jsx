import { useNavigate } from 'react-router-dom';

function App() {
	const navigate = useNavigate();

	const handleClick = () => {
		window.location.assign('http://localhost:3000/auth/github');
	};

	return (
		<>
			<h1>Vite + React</h1>
			<div className="card">
				<button onClick={handleClick}>data is {}</button>
				<p>
					Edit <code>src/App.jsx</code> and save to test HMR
				</p>
			</div>
			<p className="read-the-docs">
				Click on the Vite and React logos to learn more
			</p>
		</>
	);
}

export default App;
