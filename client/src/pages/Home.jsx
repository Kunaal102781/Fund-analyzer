// client/src/pages/Home.jsx
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to Finance Guide</h1>
      <p>Your personal financial advisor</p>
      <div className="auth-actions">
        <Link to="/login" className="auth-button">Login</Link>
        <Link to="/register" className="auth-button">Register</Link>
      </div>
    </div>
  );
}