import { LogoutIcon } from '../common/Icons.jsx';

// Frontend demo: the Sidebar passes AuthContext's signOut, which only switches back to the login screens.
export default function LogoutButton({ onClick }) {
  return (
    <button type="button" className="logout-btn" onClick={onClick}>
      <LogoutIcon size={18} />
      Logout
    </button>
  );
}
