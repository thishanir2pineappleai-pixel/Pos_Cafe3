import { Fragment, useCallback, useMemo, useState } from 'react';
import AddButton from '../../components/buttons/AddButton.jsx';
import ClearAllButton from '../../components/buttons/ClearAllButton.jsx';
import DeleteButton from '../../components/buttons/DeleteButton.jsx';
import FilterButton from '../../components/buttons/FilterButton.jsx';
import Dropdown from '../../components/common/Dropdown.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import {
  ActivityIcon, CashIcon, CheckCircleIcon, ChevronRightIcon, EditIcon, EyeIcon, ShieldIcon, StaffIcon, SunIcon, CalendarIcon, UserIcon, XCircleIcon,
} from '../../components/common/Icons.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import SearchInput from '../../components/common/SearchInput.jsx';
import ConfirmationModal from '../../components/modals/ConfirmationModal.jsx';
import SuccessModal from '../../components/modals/SuccessModal.jsx';
import { Avatar } from '../../components/upload/AvatarUpload.jsx';
import MainLayout from '../../layout/MainLayout.jsx';
import { toAmount } from '../../validation/staffValidation.js';
import AddStaff from './AddStaff.jsx';
import { ShiftBadge, StatusBadge } from './StaffBadges.jsx';
import StaffDetails from './StaffDetails.jsx';
import { options } from './staffFormParts.jsx';
import {
  ACTIVE_SHIFT, INITIAL_STAFF, PAGE_SIZE, ROLES, SHIFTS, STAFF_ON_DUTY, TEAMS, nextStaffNumber, staffCode, staffTag,
} from './staffMockData.js';

const NO_FILTERS = { role: '', team: '', shift: '', status: '' };
const SUBTITLE = 'Manage your staff, attendance, shifts, and permissions.';

// Only the Staff List tab is built in this stage. The others have designs but are outside the approved scope, so they do nothing yet.
const TABS = [
  { id: 'list', label: 'Staff List', Icon: UserIcon, built: true },
  { id: 'shift', label: 'Shift', Icon: CalendarIcon },
  { id: 'roles', label: 'Roles & Permission', Icon: ShieldIcon },
  { id: 'payroll', label: 'Payroll', Icon: CashIcon },
  { id: 'attendance', label: 'Attendance', Icon: ActivityIcon },
];

const COLUMNS = ['Staff', 'Role & Team', 'Shift', 'Contact', 'Last Login', 'Status', 'Action'];
const COLS = '1.5fr 1.1fr .9fr 1.6fr 1fr .8fr 1fr';

const crumbs = (...parts) => parts.map((part, i) => (
  <Fragment key={part}>{i > 0 && <ChevronRightIcon size={22} className="title-sep" />}{part}</Fragment>
));

function SummaryCard({ tone, Icon, label, value }) {
  return (
    <div className="staff-stat">
      <span className={`staff-stat__icon staff-stat__icon--${tone}`}><Icon size={20} /></span>
      <div>
        <div className="staff-stat__label">{label}</div>
        <div className="staff-stat__value">{value}</div>
      </div>
    </div>
  );
}

// The forms hold typed text like "60,000.00"; the record keeps real numbers.
const withAmounts = (s) => ({ ...s, salary: { ...s.salary, basic: toAmount(s.salary.basic), otRate: s.salary.overtime ? toAmount(s.salary.otRate) : '' } });

const two = (n) => String(n).padStart(2, '0');

function FilterSelect({ label, value, list, allLabel, onChange }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <Dropdown className="dropdown--green" triangle value={value} placeholder={allLabel}
        options={[{ value: '', label: allLabel }, ...options(list)]} onChange={onChange} />
    </div>
  );
}

// ponytail: staff live in local state only (lost on reload); no API or database is connected.
export default function StaffManagement() {
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [screen, setScreen] = useState({ name: 'list' }); // list | add | details | edit
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (title, message) => setToast({ id: Date.now(), title, message });
  const closeToast = useCallback(() => setToast(null), []);
  const toList = () => setScreen({ name: 'list' });

  const current = staff.find((s) => s.id === screen.id);

  const stats = useMemo(() => {
    const active = staff.filter((s) => s.active).length;
    return { total: staff.length, active, inactive: staff.length - active };
  }, [staff]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const squashed = term.replace(/\s/g, '');
    return staff.filter((s) => {
      if (filters.role && s.role !== filters.role) return false;
      if (filters.team && s.team !== filters.team) return false;
      if (filters.shift && s.shift !== filters.shift) return false;
      if (filters.status && (s.active ? 'Active' : 'Inactive') !== filters.status) return false;
      if (!term) return true;
      return [s.name, s.code, staffTag(s.id), s.role, s.phone, s.email].some((text) => {
        const t = text.toLowerCase();
        return t.includes(term) || t.replace(/\s/g, '').includes(squashed);
      });
    });
  }, [staff, query, filters]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const updateQuery = (value) => { setQuery(value); setPage(1); };
  const updateFilter = (key) => (value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };
  const clearFilters = () => { setFilters(NO_FILTERS); setPage(1); };

  const addStaff = ({ password, ...values }) => { // the typed password is dropped: this demo keeps no credentials
    const id = nextStaffNumber(staff);
    setStaff((list) => [{ ...withAmounts(values), id, code: staffCode(id), lastLogin: null }, ...list]);
    setPage(1);
    toList();
    showToast('Staff Added Successfully!', 'The new staff has been added and is now active in the system.');
  };

  const saveEdit = (draft) => {
    setStaff((list) => list.map((s) => (s.id === draft.id ? withAmounts(draft) : s)));
    toList();
    showToast('Staff Updated Successfully!', 'The staff details has been updated in the system.');
  };

  const confirmDelete = () => {
    setStaff((list) => list.filter((s) => s.id !== deleting.id));
    setDeleting(null);
    showToast('Staff deleted successfully', 'This staff details deleted permanently.');
  };

  const title = screen.name === 'add' ? crumbs('Staff Management', 'Staff List', 'Add Staff') : crumbs('Staff Management', 'Staff List');

  return (
    <MainLayout title={title} subtitle={SUBTITLE} active="Staff Management">
      {screen.name === 'list' && (
        <>
          <div className="staff-tabs" role="tablist">
            {TABS.map(({ id, label, Icon, built }) => (
              <button type="button" role="tab" key={id} aria-selected={Boolean(built)} aria-disabled={!built}
                title={built ? undefined : 'Not built yet in this stage'}
                className={`staff-tab${built ? ' is-active' : ''}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          <section className="staff-stats">
            <SummaryCard tone="blue" Icon={StaffIcon} label="Total Staff" value={stats.total} />
            <SummaryCard tone="green" Icon={CheckCircleIcon} label="Active Staff" value={two(stats.active)} />
            <SummaryCard tone="red" Icon={XCircleIcon} label="Inactive Staff" value={two(stats.inactive)} />
            <SummaryCard tone="purple" Icon={StaffIcon} label="Staff on Duty" value={STAFF_ON_DUTY} />
            <SummaryCard tone="blue" Icon={SunIcon} label="Active Shift" value={ACTIVE_SHIFT} />
          </section>

          <section className="panel staff-panel">
            <div className="staff-panel__top">
              <h2>Staff Details</h2>
              <SearchInput value={query} onChange={updateQuery} placeholder="Search by staff id, name, role, phone, email...." />
              <FilterButton open={filterOpen} onClick={() => setFilterOpen(!filterOpen)} />
              <AddButton label="Add Staff" onClick={() => setScreen({ name: 'add' })} />
            </div>

            {filterOpen && (
              <div className="staff-filters">
                <FilterSelect label="Role" value={filters.role} list={ROLES} allLabel="All Roles" onChange={updateFilter('role')} />
                <FilterSelect label="Team" value={filters.team} list={TEAMS} allLabel="All Teams" onChange={updateFilter('team')} />
                <FilterSelect label="Shift" value={filters.shift} list={SHIFTS} allLabel="All Shift" onChange={updateFilter('shift')} />
                <FilterSelect label="Status" value={filters.status} list={['Active', 'Inactive']} allLabel="All Status" onChange={updateFilter('status')} />
                <ClearAllButton onClick={clearFilters} />
              </div>
            )}

            <div className="gtable staff-table" style={{ '--cols': COLS }}>
              <div className="gtable__inner">
                <div className="gtable__row gtable__head">
                  {COLUMNS.map((c) => <span key={c}>{c}</span>)}
                </div>
                {pageRows.length === 0 && <EmptyState message="No staff found" />}
                {pageRows.map((s) => (
                  <div className="gtable__row" key={s.id}>
                    <span className="staff-cell">
                      <Avatar src={s.avatar} size={34} />
                      <span><strong>{s.name}</strong><small>{staffTag(s.id)}</small></span>
                    </span>
                    <span className="staff-cell staff-cell--stack"><strong>{s.role}</strong><small>{s.team}</small></span>
                    <span><ShiftBadge shift={s.shift} /></span>
                    <span className="staff-cell staff-cell--stack"><strong>{s.phone}</strong><span>{s.email}</span></span>
                    <span className="staff-cell staff-cell--stack">
                      {s.lastLogin ? <><span>{s.lastLogin.date}</span><span>{s.lastLogin.time}</span></> : <span>-</span>}
                    </span>
                    <span><StatusBadge active={s.active} /></span>
                    <span className="ptable__actions">
                      <button type="button" className="icon-btn icon-btn--green" aria-label={`View ${s.name}`} title="View"
                        onClick={() => setScreen({ name: 'details', id: s.id })}><EyeIcon size={15} /></button>
                      <button type="button" className="icon-btn icon-btn--orange" aria-label={`Edit ${s.name}`} title="Edit"
                        onClick={() => setScreen({ name: 'edit', id: s.id })}><EditIcon size={15} /></button>
                      <DeleteButton label={`Delete ${s.name}`} onClick={() => setDeleting(s)} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Pagination page={safePage} pageSize={PAGE_SIZE} total={visible.length} onChange={setPage} label="staffs" />
          </section>
        </>
      )}

      {screen.name === 'add' && (
        <AddStaff nextCode={staffCode(nextStaffNumber(staff))} onCancel={toList} onSave={addStaff} />
      )}

      {(screen.name === 'details' || screen.name === 'edit') && current && (
        <StaffDetails key={`${current.id}-${screen.name}`} staff={current} editing={screen.name === 'edit'}
          onClose={toList} onEdit={() => setScreen({ name: 'edit', id: current.id })}
          onCancelEdit={() => setScreen({ name: 'details', id: current.id })} onSave={saveEdit} />
      )}

      {deleting && (
        <ConfirmationModal message='Click "Delete" to remove this staff.' confirmLabel="Delete"
          onCancel={() => setDeleting(null)} onConfirm={confirmDelete}>
          <div className="modal__product"><Avatar src={deleting.avatar} size={24} />{deleting.name}</div>
        </ConfirmationModal>
      )}

      {toast && <SuccessModal key={toast.id} title={toast.title} message={toast.message} onClose={closeToast} />}
    </MainLayout>
  );
}
