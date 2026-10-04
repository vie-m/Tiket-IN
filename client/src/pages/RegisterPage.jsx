import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // client-side checks first (the server validates again - never trust only the browser)
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setSubmitting(true);
    try {
      await api.register(form.fullName, form.email, form.password);
      navigate('/login', { state: { message: 'Account created! Please log in.' } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
      <h1 className="mb-4 text-2xl font-bold">Sign up</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ErrorMessage message={error} />
        <input className="input" name="fullName" placeholder="Full name" required value={form.fullName} onChange={update} />
        <input className="input" name="email" type="email" placeholder="Email" required value={form.email} onChange={update} />
        <input className="input" name="password" type="password" placeholder="Password (min 8 characters)" required value={form.password} onChange={update} />
        <input className="input" name="confirm" type="password" placeholder="Confirm password" required value={form.confirm} onChange={update} />
        <button className="btn w-full" disabled={submitting}>{submitting ? 'Creating...' : 'Create account'}</button>
      </form>
      <p className="mt-4 text-sm">Already have an account? <Link className="text-indigo-600 underline" to="/login">Log in</Link></p>
    </div>
  );
}
