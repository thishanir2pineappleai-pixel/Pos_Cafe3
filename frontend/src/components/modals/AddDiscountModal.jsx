import { useState } from 'react';
import { ModalHeader, ModalShell } from './ConfirmationModal.jsx';
import SaveButton from '../buttons/SaveButton.jsx';

export default function AddDiscountModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('');
  const pct = Number(percentage);
  const valid = name.trim() && percentage !== '' && pct >= 0 && pct <= 100;
  const submit = (e) => { e.preventDefault(); if (valid) onSave({ name: name.trim(), percentage: pct }); };

  return (
    <ModalShell className="modal--form" onClose={onClose}>
      <ModalHeader title="Add Discount Name" onClose={onClose} />
      <form className="modal__body" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Discount Name</span>
          <input className="input" autoFocus value={name} placeholder="Discount Type" onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Discount Percentage</span>
          <span className="input-suffix">
            <input className="input" type="number" min="0" max="100" value={percentage}
              placeholder="Enter Discount percentage" onChange={(e) => setPercentage(e.target.value)} />
            <span>%</span>
          </span>
        </label>
        <SaveButton type="submit" label="Add" className="btn-block" />
      </form>
    </ModalShell>
  );
}
