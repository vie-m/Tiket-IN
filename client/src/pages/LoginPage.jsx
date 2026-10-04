import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ProtectedRoute / event page pass the page the user came from
  const from = location.state?.from?.pathname || '/';
  const message = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">Log in</h1>
      {message && <p className="mb-3 rounded-lg bg-green-50 px-4 py-2 text-green-700">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <ErrorMessage message={error} />
        <input className="input" type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn w-full" disabled={submitting}>{submitting ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p className="mt-4 text-sm">Don't have an account? <Link className="text-indigo-600 underline" to="/register">Sign up</Link></p>
    </div>
  );
}
