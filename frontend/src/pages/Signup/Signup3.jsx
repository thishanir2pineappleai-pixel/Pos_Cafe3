import { useState } from 'react';
import NextButton from '../../components/buttons/NextButton.jsx';
import PreviousButton from '../../components/buttons/PreviousButton.jsx';
import PasswordInput from '../../components/common/PasswordInput.jsx';
import { SignupLayout } from '../../stepper/SignupStepper.jsx';
import { validateEmail, validateRequired } from '../../validation/authValidation.js';

// Step 1: Account credentials. FRONTEND DEMO: nothing is stored or sent, values only move to the next step.
// PENDING: the Figma shows no password rule here, so only "not empty" is checked; the terms box is required.
export default function Signup3({ values, onChange, onNext, onPrevious }) {
  const [errors, setErrors] = useState({});

  const edit = (field) => (e) => { onChange({ [field]: e.target.value }); setErrors((er) => ({ ...er, [field]: '' })); };
  const next = (e) => {
    e.preventDefault();
    const found = {
      email: validateEmail(values.email),
      username: validateRequired(values.username, 'Enter a username.'),
      password: validateRequired(values.password, 'Enter a password.'),
      agreed: values.agreed ? '' : 'Please accept the terms of service and privacy policy.',
    };
    setErrors(found);
    if (!Object.values(found).some(Boolean)) onNext();
  };

  return (
    <SignupLayout current={1} title="Get Started With PAI POS" subtitle="Account credentials">
      <form className="signup-card" onSubmit={next} noValidate>
        <label className="signup-field">
          <span className="signup-label">Email address</span>
          <input className={`input${errors.email ? ' has-error' : ''}`} type="email" value={values.email} placeholder="example@gmail.com"
            onChange={edit('email')} autoComplete="off" />
          {errors.email && <span className="auth-error auth-error--small">{errors.email}</span>}
        </label>
        <label className="signup-field">
          <span className="signup-label">Username</span>
          <input className={`input${errors.username ? ' has-error' : ''}`} value={values.username} placeholder="eg: Jhon"
            onChange={edit('username')} autoComplete="off" />
          {errors.username && <span className="auth-error auth-error--small">{errors.username}</span>}
        </label>
        <div className="signup-field">
          <span className="signup-label">Password</span>
          <PasswordInput invalid={Boolean(errors.password)} value={values.password} placeholder="************" aria-label="Password" onChange={edit('password')} />
          {errors.password && <span className="auth-error auth-error--small">{errors.password}</span>}
        </div>
        <label className="check check--terms">
          <input type="checkbox" checked={values.agreed} onChange={(e) => { onChange({ agreed: e.target.checked }); setErrors((er) => ({ ...er, agreed: '' })); }} />
          <span>By checking this box, you agree to our <button type="button" className="link-btn">terms of service</button> and <button type="button" className="link-btn">privacy policy</button>.</span>
        </label>
        {errors.agreed && <span className="auth-error auth-error--small">{errors.agreed}</span>}
        <div className="signup-actions">
          <PreviousButton onClick={onPrevious} />
          <NextButton type="submit" />
        </div>
      </form>
    </SignupLayout>
  );
}
