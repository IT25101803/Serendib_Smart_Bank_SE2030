import { LanguageButtons, Text } from '../i18n';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { send } from '../api/client';
import { Field, ErrorMessage, PasswordInput } from '../components/ui';

export function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();

  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');

  if (auth.user) return <Navigate to="/app" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (register) {
        if (isExistingCustomer) {
          await send('/auth/register-existing', {
            nic: nic.trim(),
            email: email.trim(),
            phone: phone.trim(),
            username: username.trim(),
            password
          });
          setSuccess('Online Banking activated for your existing bank account! Sign in to view your accounts.');
        } else {
          await send('/auth/register', { username: username.trim(), email: email.trim(), password });
          setSuccess('Your customer profile is ready. Sign in to continue.');
        }
        setPassword('');
      } else {
        await auth.login(username, password);
        navigate('/app');
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell">
      <section className="auth-story">
        <Link className="brand" to="/">
          <img className="brand-mark" src="/images/logo.jpeg" alt="Serendib Smart Bank Logo" />
          <span>serendib<small>SMART BANK</small></span>
        </Link>
        <span className="eyebrow">A LITTLE CLOSER TO YOUR GOALS</span>
        <h1>Everyday banking.<br /><em>Thoughtfully simple.</em></h1>
        <p>A single place for your accounts, payments and future plans.</p>
        <div className="auth-art">
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="illustration-card">
            <small>SERENDIB · DEMONSTRATION</small>
            <strong>Made for your<br />next chapter.</strong>
            <span>◈ &nbsp; LKR BANKING</span>
          </div>
        </div>
        <small><Text value={"Academic simulation · No real financial services"} /></small>
      </section>

      <section className="auth-form">
        <div className="auth-form-inner">
          <LanguageButtons />
          <Link className="subtle-link" to="/">← Back to home</Link>
          <span className="eyebrow">WELCOME TO SERENDIB</span>
          <h2>{register ? <Text value="Start your journey" /> : <Text value="Welcome back" />}</h2>
          <p>
            {register
              ? <Text value="Create your customer profile or activate online access for your existing bank account." />
              : <Text value="One secure login for customers, bank staff, branch managers and system administrators. Your account determines your workspace." />
            }
          </p>

          {auth.notice && <div className="alert">{auth.notice}</div>}
          {success && (
            <div className="alert success">
              {success} <Link to="/login"><Text value={"Sign in"} /></Link>
            </div>
          )}

          <ErrorMessage error={error} />

          {register && (
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '0.25rem',
              borderRadius: '8px',
              marginBottom: '1.25rem'
            }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  background: !isExistingCustomer ? '#ffffff' : 'transparent',
                  color: !isExistingCustomer ? '#0f172a' : '#64748b',
                  fontWeight: !isExistingCustomer ? 700 : 500,
                  boxShadow: !isExistingCustomer ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setIsExistingCustomer(false)}
              >
                New Customer Signup
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  background: isExistingCustomer ? '#ffffff' : 'transparent',
                  color: isExistingCustomer ? '#0f172a' : '#64748b',
                  fontWeight: isExistingCustomer ? 700 : 500,
                  boxShadow: isExistingCustomer ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setIsExistingCustomer(true)}
              >
                Existing Bank Account Customer
              </button>
            </div>
          )}

          <form onSubmit={submit}>
            {register && isExistingCustomer && (
              <>
                <Field label="Customer NIC Number *">
                  <input
                    required
                    type="text"
                    maxLength={12}
                    placeholder="e.g. 199012345678 or 901234567V"
                    value={nic}
                    onChange={e => setNic(e.target.value.slice(0, 12))}
                  />
                </Field>
                <Field label="Bank Registered Email Address *">
                  <input
                    required
                    type="email"
                    placeholder="Email registered with Serendib Bank"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Bank Registered Phone Number *">
                  <input
                    required
                    type="tel"
                    placeholder="Phone number registered with Serendib Bank"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </Field>
              </>
            )}

            <Field label="Username *">
              <input
                required
                minLength={3}
                maxLength={50}
                autoComplete="username"
                pattern={register ? '[A-Za-z0-9_.-]{3,50}' : undefined}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </Field>

            {register && !isExistingCustomer && (
              <Field label="Email *">
                <input
                  required
                  type="email"
                  maxLength={100}
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </Field>
            )}

            <Field label="Password *">
              <PasswordInput
                required
                minLength={register ? 8 : undefined}
                maxLength={72}
                autoComplete={register ? 'new-password' : 'current-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </Field>

            <button className="full" disabled={busy}>
              <Text value={busy ? 'Please wait…' : (register ? (isExistingCustomer ? 'Activate Online Banking' : 'Create customer profile') : 'Sign in')} />
            </button>
          </form>

          <p>
            <Text value={register ? 'Already a customer?' : 'New to Serendib?'} />{' '}
            <Link to={register ? '/login' : '/register'}>
              <Text value={register ? 'Sign in' : 'Register'} />
            </Link>
          </p>

          <Link className="subtle-link" to="/reviews">Read customer reviews</Link>
          <p className="fine-print">Accounts are provisioned separately for the academic demonstration. Never enter real banking credentials.</p>
        </div>
      </section>
    </div>
  );
}
