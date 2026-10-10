import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthLayout } from '../components/layout/AuthLayout.jsx';
import { TextField } from '../components/ui/TextField.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorBanner } from '../components/ui/Card.jsx';
import { ApiError } from '../api/client.js';

/**
 * Backend validation errors arrive as `{ code: 'VALIDATION_ERROR', details:
 * [{ path, message }] }` — this turns that into a `{ [path]: message }`
 * map so each field can show its own error instead of one generic banner.
 * @param {ApiError | null} error
 */
function fieldErrorsFrom(error) {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_ERROR') return {};
  return Object.fromEntries((error.details ?? []).map((detail) => [detail.path, detail.message]));
}

export function RegisterPage() {
  const { register, isRegistering, registerError } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fieldErrors = fieldErrorsFrom(registerError);
  const showGenericError = registerError instanceof ApiError && registerError.code !== 'VALIDATION_ERROR';

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await register({ name, email, password });
      navigate('/', { replace: true });
    } catch {
      // surfaced via registerError / fieldErrors below
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Set up your Copilot workspace in a minute.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {showGenericError && <ErrorBanner message={registerError.message} />}

        <TextField
          id="name"
          label="Full name"
          autoComplete="name"
          value={name}
          onChange={setName}
          error={fieldErrors.name}
          placeholder="Ada Lovelace"
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={fieldErrors.email}
          placeholder="you@company.com"
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          placeholder="At least 8 characters"
        />

        <Button type="submit" loading={isRegistering} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-(--color-ink-soft)">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-(--color-accent) hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
