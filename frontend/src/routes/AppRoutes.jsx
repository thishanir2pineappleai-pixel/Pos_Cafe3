import { useState } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { NavigationContext } from '../context/NavigationContext.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import ProductManagement from '../pages/MenuManagement/ProductManagement.jsx';
import SalesManagement from '../pages/SalesManagement/SalesManagement.jsx';
import Settings from '../pages/Settings/Settings.jsx';
import StaffManagement from '../pages/StaffManagement/StaffManagement.jsx';
import AuthFlow from './AuthFlow.jsx';

const PAGES = ['Dashboard', 'Staff Management', 'Menu Management', 'Sales Management', 'Settings'];

// ponytail: no router library is installed, so the sidebar switches between the built pages with state.
// All pages stay mounted (hidden when inactive) so each keeps its local demo data while you navigate.
// Swap this for real routes (react-router) once more pages exist.
function SignedInPages() {
  const [page, setPage] = useState('Dashboard');
  const navigate = (label) => { if (PAGES.includes(label)) setPage(label); };

  return (
    <NavigationContext.Provider value={navigate}>
      <div hidden={page !== 'Dashboard'}><Dashboard /></div>
      <div hidden={page !== 'Staff Management'}><StaffManagement /></div>
      <div hidden={page !== 'Menu Management'}><ProductManagement /></div>
      <div hidden={page !== 'Sales Management'}><SalesManagement /></div>
      <div hidden={page !== 'Settings'}><Settings /></div>
    </NavigationContext.Provider>
  );
}

// FRONTEND DEMO: "signed in" is only a screen switch (see AuthContext); there is no real authentication.
function Screens() {
  const { signedIn } = useAuth();
  return signedIn ? <SignedInPages /> : <AuthFlow />;
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <Screens />
    </AuthProvider>
  );
}
