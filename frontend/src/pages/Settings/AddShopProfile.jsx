import { useState } from 'react';
import CancelButton from '../../components/buttons/CancelButton.jsx';
import SaveButton from '../../components/buttons/SaveButton.jsx';
import Dropdown from '../../components/common/Dropdown.jsx';
import FormField from '../../components/common/FormField.jsx';
import ConfirmationModal from '../../components/modals/ConfirmationModal.jsx';
import AvatarUpload from '../../components/upload/AvatarUpload.jsx';
import { validateShop } from '../../validation/profileValidation.js';

const TIMEZONES = [
  '(GMT +00:00) UTC',
  '(GMT +04:00) Dubai',
  '(GMT +05:30) India / Colombo',
  '(GMT +08:00) Singapore',
  '(GMT +10:00) Australia/Sydney',
].map((label) => ({ value: label, label }));

const BLANK = { name: '', address: '', phone: '', email: '', website: '', timezone: '', avatar: null };

// Add / Edit Shop Profile form (EditShopProfile renders this with mode="edit").
export default function AddShopProfile({ mode = 'add', profile, onCancel, onSave }) {
  const edit = mode === 'edit';
  const [values, setValues] = useState(profile ? { ...BLANK, ...profile } : BLANK);
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  const set = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const text = (key, placeholder) => (
    <input className={`input${errors[key] ? ' has-error' : ''}`} value={values[key]} placeholder={placeholder}
      onChange={(e) => set(key, e.target.value)} />
  );

  const requestSave = () => {
    const found = validateShop(values);
    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  return (
    <section className="panel settings-card profile-form">
      <h2 className="settings-card__title">Business Information</h2>
      <div className="profile-form__avatar"><AvatarUpload value={values.avatar} onChange={(url) => set('avatar', url)} /></div>

      <FormField label="Shop Name" error={errors.name} className="field--short">{text('name', 'Enter shop name')}</FormField>
      <FormField label="Business Address" error={errors.address}>{text('address', 'Enter shop address')}</FormField>
      <FormField label="Phone Number" error={errors.phone}>{text('phone', 'Enter phone number')}</FormField>
      <FormField label="Email" optional error={errors.email}>{text('email', 'Enter email address')}</FormField>
      <FormField label="Website" optional>{text('website', 'Enter your website')}</FormField>
      <div className="field">
        <span className="field-label">Timezone</span>
        <Dropdown className={`dropdown--tz${errors.timezone ? ' has-error' : ''}`} triangle value={values.timezone}
          options={TIMEZONES} placeholder="Select timezone" onChange={(v) => set('timezone', v)} />
        {errors.timezone && <span className="field-error">{errors.timezone}</span>}
      </div>

      <div className="profile-form__actions">
        <CancelButton className="profile-cancel" onClick={onCancel} />
        <SaveButton className="profile-save" label="Save" onClick={requestSave} />
      </div>

      {confirming && (
        <ConfirmationModal
          message={edit ? "Click 'Save Changes' to update your profile." : "Let's set up your shop profile!"}
          confirmLabel={edit ? 'Save Changes' : 'Save'}
          onCancel={() => setConfirming(false)}
          onConfirm={() => onSave({ ...values, name: values.name.trim() })} />
      )}
    </section>
  );
}
