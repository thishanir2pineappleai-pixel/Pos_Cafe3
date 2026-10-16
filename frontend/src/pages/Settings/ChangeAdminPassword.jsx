import { useState } from 'react';
import { EditSquareIcon, EyeIcon, EyeOffIcon } from '../../components/common/Icons.jsx';
import ConfirmationModal from '../../components/modals/ConfirmationModal.jsx';

// Password row of the View Admin Profile screen: new-password input, Update button and confirmation.
// onDraftChange(true/false) tells the page whether a new password is being typed (the header changes to "Update Admin Password").
export default function ChangeAdminPassword({ onDraftChange, onUpdate }) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const change = (next) => { setValue(next); onDraftChange(next !== ''); };
  const confirm = () => {
    onUpdate(value);
    setConfirming(false);
    setValue('');
    setVisible(false);
    onDraftChange(false);
  };

  return (
    <>
      <span className="input-suffix password-row__input">
        <input className="input" type={visible ? 'text' : 'password'} value={value} placeholder="Enter new password"
          onChange={(e) => change(e.target.value)} />
        {value && (
          <button type="button" className="eye-btn" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>
            {visible ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
          </button>
        )}
      </span>
      <button type="button" className="btn btn-outline-green password-row__update" onClick={() => { if (value) setConfirming(true); }}>
        <EditSquareIcon size={15} />Update
      </button>

      {confirming && (
        <ConfirmationModal message="Click 'Save Changes' to update your Password." confirmLabel="Save Changes"
          onCancel={() => setConfirming(false)} onConfirm={confirm} />
      )}
    </>
  );
}
