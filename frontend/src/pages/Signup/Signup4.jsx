import { useState } from 'react';
import VerifyEmailButton from '../../components/buttons/VerifyEmailButton.jsx';
import { OtpEntry } from '../../components/common/OtpInput.jsx';
import { SignupLayout } from '../../stepper/SignupStepper.jsx';
import { validateOtp } from '../../validation/authValidation.js';

// Step 2: Email verification. FRONTEND DEMO: only checks that six digits were typed. No code is sent or verified.
export default function Signup4({ onNext }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const verify = () => {
    const found = validateOtp(code);
    setError(found);
    if (!found) onNext();
  };

  return (
    <SignupLayout current={2} title="Email verification">
      <div className="signup-card signup-card--otp">
        <p className="signup-note">Verification code is sent to the registered email for authentication</p>
        <span className="signup-label">Email verification code</span>
        <OtpEntry code={code} onChange={(next) => { setCode(next); setError(''); }} error={error} />
        <VerifyEmailButton onClick={verify} />
      </div>
    </SignupLayout>
  );
}
