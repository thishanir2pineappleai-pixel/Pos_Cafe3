import { PinIcon, PlusIcon } from '../../components/common/Icons.jsx';
import { Avatar } from '../../components/upload/AvatarUpload.jsx';

export function CreateCard({ title, hint, onClick }) {
  return (
    <button type="button" className="create-card" onClick={onClick}>
      <span className="create-card__plus"><PlusIcon size={26} /></span>
      <strong>{title}</strong>
      <small>{hint}</small>
    </button>
  );
}

// Shop Profiles tab: the create card until a profile exists, then the profile card.
export default function ShopProfiles({ shop, onCreate, onOpen }) {
  if (!shop) return <CreateCard title="Create Shop Profile" hint="Add a new shop to your business" onClick={onCreate} />;

  return (
    <button type="button" className="profile-card" onClick={onOpen}>
      <span className="badge-mint">Active</span>
      <span className="profile-card__head">
        <Avatar src={shop.avatar} size={52} />
        <span className="profile-card__name">{shop.name}</span>
      </span>
      <span className="profile-card__address"><PinIcon size={11} /><span>{shop.address}</span></span>
      <span className="profile-card__meta">Updated on {shop.updatedOn}</span>
    </button>
  );
}
