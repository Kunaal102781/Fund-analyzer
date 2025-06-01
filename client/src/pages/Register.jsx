// client/src/pages/Register.jsx
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../utils/auth';

export default function Register() {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(userData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={userData.name}
          onChange={(e) => setUserData({...userData, name: e.target.value})}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={userData.email}
          onChange={(e) => setUserData({...userData, email: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={userData.password}
          onChange={(e) => setUserData({...userData, password: e.target.value})}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}