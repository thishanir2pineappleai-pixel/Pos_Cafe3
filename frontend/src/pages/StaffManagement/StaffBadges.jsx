import { UserIcon } from '../../components/common/Icons.jsx';

export function ShiftBadge({ shift }) {
  return <span className={`badge badge--shift-${shift.toLowerCase()}`}>{shift}</span>;
}

export function StatusBadge({ active }) {
  return <span className={`badge badge--${active ? 'active' : 'inactive'}`}>{active ? 'Active' : 'Inactive'}</span>;
}

// Square staff picture (detail pages) or the green user icon when there is none. Photos are not part of the project assets yet.
export function StaffPhoto({ src, size = 76, children }) {
  return (
    <span className="staff-photo" style={{ width: size, height: size }}>
      {src ? <img src={src} alt="" /> : <UserIcon size={Math.round(size * 0.45)} />}
      {children}
    </span>
  );
}
