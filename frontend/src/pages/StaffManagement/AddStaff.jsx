import { useState } from 'react';
import CancelButton from '../../components/buttons/CancelButton.jsx';
import SaveButton from '../../components/buttons/SaveButton.jsx';
import { AlertCircleIcon } from '../../components/common/Icons.jsx';
import StatusToggle from '../../components/common/StatusToggle.jsx';
import ConfirmationModal from '../../components/modals/ConfirmationModal.jsx';
import StaffStepper from '../../stepper/StaffStepper.jsx';
import { validateEmployment, validatePersonal, validateRecords } from '../../validation/staffValidation.js';
import {
  DocumentBox, EPF_NOTE, EpfFields, SalaryFields, StaffImageField, fieldKit, useForm,
} from './staffFormParts.jsx';
import { DAYS, DOCUMENT_SLOTS, EMPLOYMENT_TYPES, GENDERS, ROLES, SHIFTS, TEAMS, blankStaff } from './staffMockData.js';

// Add Staff: Personal Information -> Employment Details -> Employment Records. All values stay in this component until Save,
// then the parent adds a local mock record (nothing is sent to a server). `nextCode` is only a preview of the auto-generated code.
export default function AddStaff({ nextCode, onCancel, onSave }) {
  const form = useForm(blankStaff());
  const { values, errors, set, setErrors } = form;
  const [step, setStep] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const kit = fieldKit(form);

  const checks = { 1: () => validatePersonal(values), 2: () => validateEmployment(values), 3: () => validateRecords(values) };
  const advance = () => {
    const found = checks[step]();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (step < 3) setStep(step + 1);
    else setConfirming(true);
  };
  const back = () => { setErrors({}); setStep(step - 1); };

  return (
    <section className="panel staff-form">
      <StaffStepper current={step} />

      {step === 1 && (
        <div className="sf-body">
          <h2 className="sf-title">Personal Information</h2>
          <div className="sf-grid">
            {kit.text('name', 'Full Name', 'eg: John Doe')}
            {kit.pick('gender', 'Gender', GENDERS, 'eg: Male')}
            <StaffImageField form={form} />
            {kit.text('phone', 'Phone Number', 'eg: 071 123 4567')}
            {kit.text('email', 'Email', 'eg: example@gmail.com')}
            {kit.text('nic', 'NIC', 'eg: 1996 1234 5678')}
            {kit.date('dob', 'Date of Birth')}
            {kit.text('address', 'Address', 'eg: 478,  Meekanuwa Road, Kandy 20000 ,Sri Lanka', 'sf-span-2')}
          </div>
          <h2 className="sf-title sf-title--next">Emergency Contact</h2>
          <div className="sf-grid">
            {kit.text('emergency.name', 'Contact Name', 'eg: John')}
            {kit.text('emergency.relationship', 'Relationship', 'eg: Brother')}
            {kit.text('emergency.phone', 'Phone Number', 'eg: 071 123 4567')}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="sf-body">
          <h2 className="sf-title">Employment Details</h2>
          <div className="sf-grid">
            <div className="field">
              <span className="field-label">Employee Code <span className="optional">(Auto Generated)</span></span>
              <input className="input" value={nextCode} readOnly aria-readonly="true" />
            </div>
            {kit.date('joinDate', 'Join Date')}
            {kit.pick('role', 'Role', ROLES, 'eg: Manager')}
            {kit.pick('team', 'Team', TEAMS, 'eg: Service')}
            {kit.pick('employmentType', 'Employment Type', EMPLOYMENT_TYPES, 'eg: Fulltime')}
            <div className="field">
              <span className="field-label">Status</span>
              <StatusToggle checked={values.active} label={values.active ? 'Active' : 'Inactive'} onChange={(v) => set('active', v)} />
            </div>
            {!values.active && kit.text('inactiveReason', 'Reason of Inactive Staff', 'eg: Staff have to submit required documents', 'sf-span-3')}
          </div>

          <h2 className="sf-title sf-title--next">Shift Assignment</h2>
          <div className="sf-grid">
            {kit.pick('shift', 'Shift', SHIFTS, 'eg: Morning')}
            {kit.segment('workingDays', 'Working Days', DAYS, { multi: true })}
            {kit.text('hoursPerWeek', 'Working Hours/Week', 'eg: 40')}
          </div>

          <h2 className="sf-title sf-title--next">System Access</h2>
          <div className="sf-grid sf-grid--two">
            {kit.text('username', 'Username', 'eg: user123')}
            {kit.password('password', 'Password', 'eg: userpass@123')}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="sf-body">
          <h2 className="sf-title">Salary &amp; Payroll</h2>
          <div className="sf-grid sf-grid--salary"><SalaryFields kit={kit} values={values} /></div>

          <h2 className="sf-title sf-title--next">EPF &amp; ETF Information</h2>
          <div className="sf-grid sf-grid--epf"><EpfFields kit={kit} values={values} /></div>
          <p className="epf-note"><AlertCircleIcon size={13} />{EPF_NOTE}</p>

          <h2 className="sf-title sf-title--next">Required Documents</h2>
          <div className="sf-grid">
            {DOCUMENT_SLOTS.map((slot) => (
              <DocumentBox key={slot.key} slot={slot} value={values.docs[slot.key]} error={errors[`docs.${slot.key}`]}
                onPick={(file) => set(`docs.${slot.key}`, file)} />
            ))}
          </div>
        </div>
      )}

      <div className="sf-actions">
        {step === 1 ? <CancelButton className="sf-actions__side" onClick={onCancel} />
          : <CancelButton className="sf-actions__side" label="Back" onClick={back} />}
        <SaveButton className="sf-actions__main" label={step === 3 ? 'Save' : 'Continue'} onClick={advance} />
      </div>

      {confirming && (
        <ConfirmationModal message="Click 'Save' to add new staff ." confirmLabel="Save"
          onCancel={() => setConfirming(false)} onConfirm={() => onSave(values)} />
      )}
    </section>
  );
}
