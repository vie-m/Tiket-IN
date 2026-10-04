import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const link = 'hover:text-indigo-600';
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
        <Link to="/" className="mr-auto text-lg font-bold text-indigo-600">Tiket-IN</Link>
        <Link to="/" className={link}>Events</Link>
        {user ? (
          <>
            <span className="text-slate-500">Hi, {user.fullName}</span>
            <Link to="/my-tickets" className={link}>My Tickets</Link>
            {user.role === 'admin' && <Link to="/reports" className={link}>Reports</Link>}
            <button onClick={handleLogout} className={link}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={link}>Login</Link>
            <Link to="/register" className={link}>Sign up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
