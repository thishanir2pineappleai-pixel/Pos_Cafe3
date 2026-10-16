import { Fragment, useCallback, useState } from 'react';
import { ChevronRightIcon } from '../../components/common/Icons.jsx';
import SuccessModal from '../../components/modals/SuccessModal.jsx';
import MainLayout from '../../layout/MainLayout.jsx';
import AddAdminProfile from './AddAdminProfile.jsx';
import AddShopProfile from './AddShopProfile.jsx';
import AdminProfileDetails from './AdminProfileDetails.jsx';
import AdminProfiles from './AdminProfiles.jsx';
import EditAdminProfile from './EditAdminProfile.jsx';
import EditShopProfile from './EditShopProfile.jsx';
import ShopProfileDetails from './ShopProfileDetails.jsx';
import ShopProfiles from './ShopProfiles.jsx';

const TABS = [{ id: 'shop', label: 'Shop Profiles' }, { id: 'admin', label: 'Admin Profiles' }];

const crumbs = (...parts) => parts.map((part, i) => (
  <Fragment key={part}>{i > 0 && <ChevronRightIcon size={22} className="title-sep" />}{part}</Fragment>
));

const MANAGE = 'Manage your accounts details';
// [last breadcrumb, subtitle] per tab and view. Subtitles are copied from the designs, quirks included.
const HEADERS = {
  shop: {
    list: [null, MANAGE],
    add: ['Add Shop Profile', 'Add your account details.'],
    details: ['View Shop Profile', 'Add your account details.'],
    edit: ['Edit Shop Profile', 'Edit your account details.'],
  },
  admin: {
    list: [null, MANAGE],
    add: ['Add Admin Profile', 'Add your Admin details.'],
    details: ['View Admin Profile', 'Add your account details.'],
    edit: ['Edit Admin Profile', 'Add your Admin details.'],
  },
};

const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// ponytail: profiles live in local state only (lost on reload); no API or database is connected.
export default function Settings() {
  const [tab, setTab] = useState('shop');
  const [view, setView] = useState('list'); // list | add | details | edit
  const [shop, setShop] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [typingPassword, setTypingPassword] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (title, message) => setToast({ id: Date.now(), title, message });
  const closeToast = useCallback(() => setToast(null), []);
  const go = (nextTab, nextView = 'list') => { setTab(nextTab); setView(nextView); setTypingPassword(false); };

  const saveShop = (values, title, message) => {
    setShop({ ...values, updatedOn: today() });
    go('shop');
    showToast(title, message);
  };
  const saveAdmin = (values, title, message) => {
    setAdmin(values);
    go('admin');
    showToast(title, message);
  };

  let [last, subtitle] = HEADERS[tab][view];
  if (tab === 'admin' && view === 'details' && typingPassword) last = 'Update Admin Password';

  return (
    <MainLayout title={crumbs('Settings', 'Profile', ...(last ? [last] : []))} subtitle={subtitle} active="Settings">
      {view === 'list' && (
        <div className="settings-list">
          <div className="tabs" role="tablist">
            {TABS.map(({ id, label }) => (
              <button type="button" role="tab" key={id} aria-selected={tab === id} className={`tab${tab === id ? ' is-active' : ''}`}
                onClick={() => go(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="settings-list__body">
            {tab === 'shop'
              ? <ShopProfiles shop={shop} onCreate={() => go('shop', 'add')} onOpen={() => go('shop', 'details')} />
              : <AdminProfiles admin={admin} onCreate={() => go('admin', 'add')} onOpen={() => go('admin', 'details')} />}
          </div>
        </div>
      )}

      {tab === 'shop' && view === 'add' && (
        <AddShopProfile onCancel={() => go('shop')}
          onSave={(v) => saveShop(v, 'Shop Profile Added Successfully !', 'The shop has been created and is now active.')} />
      )}
      {tab === 'shop' && view === 'details' && shop && <ShopProfileDetails shop={shop} onEdit={() => go('shop', 'edit')} />}
      {tab === 'shop' && view === 'edit' && shop && (
        <EditShopProfile profile={shop} onCancel={() => go('shop', 'details')}
          onSave={(v) => saveShop(v, 'Shop profile updated successfully!', 'All changes to your shop profile have been saved.')} />
      )}

      {tab === 'admin' && view === 'add' && (
        <AddAdminProfile onCancel={() => go('admin')}
          onSave={(v) => saveAdmin(v, 'Admin Profile Added Successfully !', 'You can now log in and access the system.')} />
      )}
      {tab === 'admin' && view === 'details' && admin && (
        <AdminProfileDetails admin={admin} onEdit={() => go('admin', 'edit')} onDraftChange={setTypingPassword}
          onUpdatePassword={(password) => {
            setAdmin((a) => ({ ...a, password }));
            showToast('Password updated successfully', 'Your new password has been saved and is now active.');
          }} />
      )}
      {tab === 'admin' && view === 'edit' && admin && (
        <EditAdminProfile profile={admin} onCancel={() => go('admin', 'details')}
          onSave={(v) => saveAdmin({ ...admin, ...v, password: admin.password }, 'Admin Profile Updated Successfully !', 'You can now log in and access the system.')} />
      )}

      {toast && <SuccessModal key={toast.id} title={toast.title} message={toast.message} onClose={closeToast} />}
    </MainLayout>
  );
}
