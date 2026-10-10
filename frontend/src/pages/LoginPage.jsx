import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthLayout } from '../components/layout/AuthLayout.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorBanner } from '../components/ui/Card.jsx';
import { ApiError } from '../api/client.js';

export function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch {
      // surfaced via loginError below
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to keep your content moving.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {loginError instanceof ApiError && <ErrorBanner message={loginError.message} />}

        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
        />

        <Button type="submit" loading={isLoggingIn} className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-(--color-ink-soft)">
        New to Copilot?{' '}
        <Link to="/register" className="font-medium text-(--color-accent) hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
