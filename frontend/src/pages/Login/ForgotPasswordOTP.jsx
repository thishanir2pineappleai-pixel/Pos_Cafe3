import { useState } from 'react';
import VerifyOTPButton from '../../components/buttons/VerifyOTPButton.jsx';
import { OtpEntry } from '../../components/common/OtpInput.jsx';
import AuthLayout from '../../layout/AuthLayout.jsx';
import { validateOtp } from '../../validation/authValidation.js';

// FRONTEND DEMO: only checks that six digits were typed. No code is sent or verified, so the copy says
// "for <email>" instead of the Figma's "we've sent to your <email>".
export default function ForgotPasswordOTP({ email, onVerified, onBackToLogin }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const verify = () => {
    const found = validateOtp(code);
    setError(found);
    if (!found) onVerified();
  };

  return (
    <AuthLayout title="Code Verification"
      subtitle={<>Enter the verification code for<br /><strong className="auth-email">{email}</strong></>}>
      <div className="auth-form auth-form--otp">
        <OtpEntry code={code} onChange={(next) => { setCode(next); setError(''); }} error={error} centered />
        <VerifyOTPButton onClick={verify} />
        <button type="button" className="auth-back" onClick={onBackToLogin}>Back to Login</button>
      </div>
    </AuthLayout>
  );
}
