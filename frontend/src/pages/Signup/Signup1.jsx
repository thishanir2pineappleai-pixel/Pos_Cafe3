import { useState } from 'react';
import NextButton from '../../components/buttons/NextButton.jsx';
import { SignupLayout } from '../../stepper/SignupStepper.jsx';
import { validatePhone, validateRequired } from '../../validation/authValidation.js';

// Step 3: Owner's details.
export default function Signup1({ values, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  const edit = (field) => (e) => { onChange({ [field]: e.target.value }); setErrors((er) => ({ ...er, [field]: '' })); };
  const next = (e) => {
    e.preventDefault();
    const found = { ownerName: validateRequired(values.ownerName, "Enter the owner's name."), phone: validatePhone(values.phone) };
    setErrors(found);
    if (!found.ownerName && !found.phone) onNext();
  };

  return (
    <SignupLayout current={3} title="Owner's Details">
      <form className="signup-card" onSubmit={next} noValidate>
        <label className="signup-field">
          <span className="signup-label">Owner Name</span>
          <input className={`input${errors.ownerName ? ' has-error' : ''}`} value={values.ownerName} placeholder="eg; John" onChange={edit('ownerName')} autoComplete="off" />
          {errors.ownerName && <span className="auth-error auth-error--small">{errors.ownerName}</span>}
        </label>
        <label className="signup-field">
          <span className="signup-label">Phone Number</span>
          <input className={`input${errors.phone ? ' has-error' : ''}`} type="tel" value={values.phone} placeholder="eg; 0712345678" onChange={edit('phone')} autoComplete="off" />
          {errors.phone && <span className="auth-error auth-error--small">{errors.phone}</span>}
        </label>
        <NextButton type="submit" block />
      </form>
    </SignupLayout>
  );
}
