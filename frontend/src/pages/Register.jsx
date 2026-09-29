import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { Alert } from "../components/common/Feedback";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Create your account</h1>
      <p className="text-slate-500 mt-2">Start tracking income, expenses, budgets, and goals.</p>
      <form onSubmit={onSubmit} className="card p-6 mt-8 space-y-4">
        {error && <Alert>{error}</Alert>}
        <div>
          <label className="label">Full name</label>
          <input className="input" name="fullName" value={form.fullName} onChange={onChange} />
        </div>
        <div>
          <label className="label">Username</label>
          <input className="input" name="username" value={form.username} onChange={onChange} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" name="email" value={form.email} onChange={onChange} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            name="password"
            minLength={6}
            value={form.password}
            onChange={onChange}
            required
          />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-semibold">
          Login
        </Link>
      </p>
    </div>
  );
}
