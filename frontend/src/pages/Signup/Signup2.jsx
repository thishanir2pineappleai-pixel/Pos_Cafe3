import { useState } from 'react';
import NextButton from '../../components/buttons/NextButton.jsx';
import PreviousButton from '../../components/buttons/PreviousButton.jsx';
import { OtpEntry } from '../../components/common/OtpInput.jsx';
import { SignupLayout } from '../../stepper/SignupStepper.jsx';
import { validateOtp } from '../../validation/authValidation.js';

// Step 4: Phone number verification. FRONTEND DEMO: only checks that six digits were typed. No code is sent or verified.
export default function Signup2({ onNext, onPrevious }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const next = () => {
    const found = validateOtp(code);
    setError(found);
    if (!found) onNext();
  };

  return (
    <SignupLayout current={4} title="Phone Number Verification">
      <div className="signup-card signup-card--otp">
        <p className="signup-note">Verification code is sent to the registered Phone number for authentication</p>
        <span className="signup-label">Phone number verification code</span>
        <OtpEntry code={code} onChange={(next2) => { setCode(next2); setError(''); }} error={error} />
        <div className="signup-actions">
          <PreviousButton onClick={onPrevious} />
          <NextButton onClick={next} />
        </div>
      </div>
    </SignupLayout>
  );
}
