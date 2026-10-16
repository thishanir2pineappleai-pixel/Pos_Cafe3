import { useState } from 'react';
import NextButton from '../../components/buttons/NextButton.jsx';
import { ChevronLeftIcon } from '../../components/common/Icons.jsx';
import illustration from '../../assets/images/access-key-illustration.png';
import { validateRequired } from '../../validation/authValidation.js';

// Access-key activation. FRONTEND DEMO: the key is not checked (there is no backend and the key format is unknown),
// so only "not empty" is validated and no activation message is shown.
export default function AccessKey({ onBack, onNext }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const found = validateRequired(key, 'Enter your access key.');
    setError(found);
    if (!found) onNext();
  };

  return (
    <div className="access-page">
      <form className="access" onSubmit={submit} noValidate>
        <button type="button" className="info-page__back access__back" onClick={onBack} aria-label="Back"><ChevronLeftIcon size={16} /></button>
        <img className="access__art" src={illustration} alt="" />
        <p className="access__text">Check your email for the access key and enter it to activate your account.</p>
        <label className="signup-field">
          <span className="signup-label">Access key</span>
          <input className={`input${error ? ' has-error' : ''}`} value={key} placeholder="Enter your access key" autoComplete="off"
            onChange={(e) => { setKey(e.target.value); setError(''); }} />
          {error && <span className="auth-error auth-error--small">{error}</span>}
        </label>
        <NextButton type="submit" block dark />
      </form>
    </div>
  );
}
