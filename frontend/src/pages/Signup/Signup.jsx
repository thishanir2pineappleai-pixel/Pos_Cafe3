import { useState } from 'react';
import NextButton from '../../components/buttons/NextButton.jsx';
import { SignupLayout } from '../../stepper/SignupStepper.jsx';
import { validateRequired } from '../../validation/authValidation.js';

// Step 5: Business details. FRONTEND DEMO: no account is created.
export default function Signup({ values, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  const edit = (field) => (e) => { onChange({ [field]: e.target.value }); setErrors((er) => ({ ...er, [field]: '' })); };
  const next = (e) => {
    e.preventDefault();
    const found = {
      businessName: validateRequired(values.businessName, 'Enter the business name.'),
      address: validateRequired(values.address, 'Enter the address.'),
    };
    setErrors(found);
    if (!found.businessName && !found.address) onNext();
  };

  return (
    <SignupLayout current={5} title="Business Details">
      <form className="signup-card" onSubmit={next} noValidate>
        <label className="signup-field">
          <span className="signup-label">Business name</span>
          <input className={`input${errors.businessName ? ' has-error' : ''}`} value={values.businessName} placeholder="eg; John" onChange={edit('businessName')} autoComplete="off" />
          {errors.businessName && <span className="auth-error auth-error--small">{errors.businessName}</span>}
        </label>
        <label className="signup-field">
          <span className="signup-label">Address</span>
          <input className={`input${errors.address ? ' has-error' : ''}`} value={values.address} placeholder="eg; Jaffna" onChange={edit('address')} autoComplete="off" />
          {errors.address && <span className="auth-error auth-error--small">{errors.address}</span>}
        </label>
        <NextButton type="submit" block />
      </form>
    </SignupLayout>
  );
}
