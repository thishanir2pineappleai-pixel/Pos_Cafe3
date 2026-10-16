import { useState } from 'react';
import { ModalHeader, ModalShell } from './ConfirmationModal.jsx';
import SaveButton from '../buttons/SaveButton.jsx';

export default function AddCategoryModal({ onSave, onClose }) {
  const [name, setName] = useState('');
  const submit = (e) => { e.preventDefault(); if (name.trim()) onSave(name.trim()); };

  return (
    <ModalShell className="modal--form" onClose={onClose}>
      <ModalHeader title="Add category" onClose={onClose} />
      <form className="modal__body" onSubmit={submit}>
        <label className="field">
          <span className="field-label">Category</span>
          <input className="input" autoFocus value={name} placeholder="Drinks" onChange={(e) => setName(e.target.value)} />
        </label>
        <SaveButton type="submit" label="Save" className="btn-block" />
      </form>
    </ModalShell>
  );
}
