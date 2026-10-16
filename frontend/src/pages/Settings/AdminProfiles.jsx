import { Avatar } from '../../components/upload/AvatarUpload.jsx';
import { CreateCard } from './ShopProfiles.jsx';

// Admin Profiles tab: the create card until an admin exists, then the admin card.
export default function AdminProfiles({ admin, onCreate, onOpen }) {
  if (!admin) return <CreateCard title="Create Admin Profile" hint="Add a new admin to your business" onClick={onCreate} />;

  return (
    <button type="button" className="profile-card profile-card--admin" onClick={onOpen}>
      <span className="badge-mint">Admin</span>
      <span className="profile-card__head">
        <Avatar src={admin.avatar} size={44} />
        <span>
          <span className="profile-card__name profile-card__name--sm">{admin.firstName} {admin.lastName}</span>
          <span className="profile-card__email">{admin.email}</span>
        </span>
      </span>
    </button>
  );
}
