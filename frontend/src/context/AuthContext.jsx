import { createContext, useContext, useMemo, useState } from 'react';

// FRONTEND DEMO ONLY. There is no backend, no account and no real authentication: "signing in" just switches the
// screen from the login pages to the app, and "Logout" switches it back. Nothing is checked, stored or sent.
const AuthContext = createContext({ signedIn: false, signIn() {}, signOut() {} });

export function AuthProvider({ children }) {
  const [signedIn, setSignedIn] = useState(false);
  const value = useMemo(() => ({ signedIn, signIn: () => setSignedIn(true), signOut: () => setSignedIn(false) }), [signedIn]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
