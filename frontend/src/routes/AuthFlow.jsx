import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ForgotPassword from '../pages/Login/ForgotPassword.jsx';
import ForgotPasswordOTP from '../pages/Login/ForgotPasswordOTP.jsx';
import Login from '../pages/Login/Login.jsx';
import PasswordResetSuccess from '../pages/Login/PasswordResetSuccess.jsx';
import ResetPassword from '../pages/Login/ResetPassword.jsx';
import AccessKey from '../pages/Signup/AccessKey.jsx';
import AccountCreated from '../pages/Signup/AccountCreated.jsx';
import ContactUs from '../pages/Signup/ContactUs.jsx';
import FAQ from '../pages/Signup/FAQ.jsx';
import Signup from '../pages/Signup/Signup.jsx';
import Signup1 from '../pages/Signup/Signup1.jsx';
import Signup2 from '../pages/Signup/Signup2.jsx';
import Signup3 from '../pages/Signup/Signup3.jsx';
import Signup4 from '../pages/Signup/Signup4.jsx';

const BLANK_SIGNUP = { email: '', username: '', password: '', agreed: false, ownerName: '', phone: '', businessName: '', address: '' };

// The screens shown before sign-in: Login, Forgot Password and the five-step Signup.
// ponytail: no router library is installed, so the current screen is a state value.
// FRONTEND DEMO ONLY: nothing is sent, stored or verified; the signup values only live here until the flow ends.
export default function AuthFlow() {
  const { signIn } = useAuth();
  const [view, setView] = useState('login');
  const [signup, setSignup] = useState(BLANK_SIGNUP);
  const [resetEmail, setResetEmail] = useState('');
  const patchSignup = (patch) => setSignup((s) => ({ ...s, ...patch }));
  const go = (next) => () => setView(next);

  switch (view) {
    case 'forgot':
      return <ForgotPassword email={resetEmail} onContinue={(email) => { setResetEmail(email); setView('forgotCode'); }} onBackToLogin={go('login')} />;
    case 'forgotCode':
      return <ForgotPasswordOTP email={resetEmail} onVerified={go('reset')} onBackToLogin={go('login')} />;
    case 'reset':
      return <ResetPassword onReset={go('resetDone')} onBackToLogin={go('login')} />;
    case 'resetDone':
      return <PasswordResetSuccess onLogin={go('login')} />;

    case 'credentials':
      return <Signup3 values={signup} onChange={patchSignup} onNext={go('emailVerify')} onPrevious={go('login')} />;
    case 'emailVerify':
      return <Signup4 onNext={go('owner')} />;
    case 'owner':
      return <Signup1 values={signup} onChange={patchSignup} onNext={go('phoneVerify')} />;
    case 'phoneVerify':
      return <Signup2 onNext={go('business')} onPrevious={go('owner')} />;
    case 'business':
      return <Signup values={signup} onChange={patchSignup} onNext={go('created')} />;
    case 'created':
      return <AccountCreated onNext={go('accessKey')} onFaq={go('faq')} onHelp={go('contact')} />;
    case 'faq':
      return <FAQ onBack={go('created')} />;
    case 'contact':
      return <ContactUs onBack={go('created')} />;
    case 'accessKey':
      return <AccessKey onBack={go('created')} onNext={() => { setSignup(BLANK_SIGNUP); setView('login'); }} />;

    default:
      return <Login onSubmit={signIn} onForgotPassword={go('forgot')} onSignup={() => { setSignup(BLANK_SIGNUP); setView('credentials'); }} />;
  }
}
