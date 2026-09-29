import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";
import { Alert } from "../components/common/Feedback";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = form.username.includes("@")
        ? { email: form.username, password: form.password }
        : { username: form.username, password: form.password };
      await login(payload);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-ink">Welcome back</h1>
      <p className="text-slate-500 mt-2">Log in to open your dashboard.</p>
      <form onSubmit={onSubmit} className="card p-6 mt-8 space-y-4">
        {error && <Alert>{error}</Alert>}
        <div>
          <label className="label">Username or email</label>
          <input className="input" name="username" value={form.username} onChange={onChange} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" name="password" value={form.password} onChange={onChange} required />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
      <p className="text-sm text-slate-500 mt-4">
        Need an account?{" "}
        <Link to="/register" className="text-primary font-semibold">
          Register
        </Link>
      </p>
    </div>
  );
}
