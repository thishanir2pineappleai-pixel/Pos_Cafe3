// "Resend" link under the code boxes. In this frontend-only stage it only restarts the on-screen timer.
export default function ResendOTPButton({ onClick }) {
  return <button type="button" className="link-btn link-btn--bold" onClick={onClick}>Resend</button>;
}
