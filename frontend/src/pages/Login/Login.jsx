import { useState } from 'react';
import LoginButton from '../../components/buttons/LoginButton.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import { AlertCircleIcon } from '../../components/common/Icons.jsx';
import AuthLayout from '../../layout/AuthLayout.jsx';
import { validateEmail, validateRequired } from '../../validation/authValidation.js';

// FRONTEND DEMO: checks only that both fields are filled and the email looks like an email.
// No credentials are verified, because there is no backend or account yet.
export default function Login({ onSubmit, onForgotPassword, onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [errors, setErrors] = useState({});

  const edit = (setter) => (e) => { setter(e.target.value); setErrors({}); };
  const submit = (e) => {
    e.preventDefault();
    const found = { email: validateEmail(email), password: validateRequired(password, 'Enter your password.') };
    if (found.email || found.password) { setErrors(found); return; }
    onSubmit({ email, keepSignedIn });
  };
  const failed = Boolean(errors.email || errors.password);

  return (
    <AuthLayout title={<>Welcome to the PAI POS<br />Owner's Dashboard</>} subtitle="Sign in to unlock your experience">
      <form className="auth-form" onSubmit={submit} noValidate>
        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input className={`input${errors.email ? ' has-error' : email ? ' is-filled' : ''}`} type="email" value={email}
            placeholder="Enter your email" onChange={edit(setEmail)} autoComplete="off" />
          {errors.email && <span className="auth-error"><AlertCircleIcon size={12} />{errors.email}</span>}
        </label>
        <div className="auth-field">
          <span className="auth-label">Password</span>
          <PasswordInput className={password && !errors.password ? 'is-filled' : ''} invalid={Boolean(errors.password)} value={password}
            placeholder="Enter your password" onChange={edit(setPassword)} />
          {errors.password && <span className="auth-error"><AlertCircleIcon size={12} />{errors.password}</span>}
        </div>
        <div className="auth-row">
          <label className="check"><input type="checkbox" checked={keepSignedIn} onChange={(e) => setKeepSignedIn(e.target.checked)} />Keep me signed in</label>
          <button type="button" className="link-btn link-btn--bold" onClick={onForgotPassword}>Forgot Password</button>
        </div>
        <LoginButton type="submit" disabled={failed} />
        <p className="auth-foot">Don't have an account? <button type="button" className="link-btn link-btn--bold" onClick={onSignup}>Sign up</button></p>
      </form>
    </AuthLayout>
  );
}
