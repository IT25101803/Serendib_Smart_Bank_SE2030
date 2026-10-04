import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { send } from '../api/client';
import { Heading, Panel, Field, ErrorMessage, Detail, PasswordInput } from '../components/ui';

export default function ProfilePage() {
  const { user, role, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nic, setNic] = useState('');
  const [dob, setDob] = useState('');
  const [profileImage, setProfileImage] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setNic(user.nic || '');
      setDob(user.dateOfBirth || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  // Handle Image File Upload (converts file to Base64 data URL)
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImage(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveProfilePicture(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('/api/customers/me/profile-image', { profileImage }, 'PATCH');
      await refresh();
      setNotice('Profile picture updated successfully.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProfilePicture() {
    setBusy(true);
    setError(null);
    try {
      await send('/api/customers/me/profile-image', {}, 'DELETE');
      setProfileImage('');
      await refresh();
      setNotice('Profile picture removed. Default avatar restored.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('/api/customers/me', { email, phone, address, nic, dateOfBirth: dob || null, profileImage }, 'PATCH');
      await refresh();
      setNotice('Profile details saved.');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function password(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await send('/auth/change-password', { currentPassword, newPassword });
      try {
        await logout();
      } catch {}
      navigate('/login');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  const avatarDisplayUrl = profileImage || user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  return (
    <>
      <Heading title="My profile" subtitle="Your personal details, profile picture, contact security and credentials." />

      <div
        className="glass-card"
        style={{
          background: `linear-gradient(135deg, rgba(10, 11, 16, 0.86) 0%, rgba(18, 19, 26, 0.92) 100%), url('/images/human_digital_banking.jpg') center/cover no-repeat`,
          borderRadius: '24px',
          padding: '2rem 2.25rem',
          border: '1px solid var(--gold-border)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative' }}>
          <img
            src={avatarDisplayUrl}
            alt={`${user?.username}'s avatar`}
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--color-gold-primary)',
              boxShadow: '0 0 20px rgba(201, 162, 39, 0.4)',
              background: 'var(--surface-secondary)'
            }}
          />
        </div>

        <div>
          <span className="eyebrow">MEMBER PROFILE &amp; AVATAR</span>
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'Playfair Display', margin: '0.25rem 0 0.4rem 0' }}>
            {user?.username} ({role})
          </h2>
          <p style={{ margin: 0, maxWidth: '580px', opacity: 0.9, fontSize: '0.95rem' }}>
            Manage your profile picture, communication preferences, National Identity registration, and security credentials.
          </p>
        </div>
      </div>

      <ErrorMessage error={error} />
      {notice && <div className="alert success">{notice}</div>}

      <div className="two-column">
        {/* PROFILE PICTURE MANAGEMENT PANEL */}
        <Panel title="Profile picture management" className="glass-card">
          <form onSubmit={handleSaveProfilePicture}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <img
                src={avatarDisplayUrl}
                alt="Avatar preview"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--color-gold-primary)',
                  boxShadow: 'var(--shadow-card)',
                  background: 'var(--surface-secondary)'
                }}
              />
              <div>
                <strong style={{ display: 'block', fontSize: '1rem' }}>Avatar Preview</strong>
                <small style={{ color: 'var(--soft-ink)' }}>Upload an image file (PNG/JPG) or enter an image URL.</small>
              </div>
            </div>

            <Field label="Upload Image File">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ cursor: 'pointer' }}
              />
            </Field>

            <Field label="Or Profile Image URL">
              <input
                type="url"
                value={profileImage}
                onChange={e => setProfileImage(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </Field>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button type="submit" disabled={busy}>Save Profile Picture</button>
              <button
                type="button"
                className="secondary"
                disabled={busy || !profileImage}
                onClick={handleDeleteProfilePicture}
              >
                Delete / Reset Picture
              </button>
            </div>
          </form>
        </Panel>

        {/* PERSONAL INFORMATION PANEL */}
        <Panel title="Personal information" className="glass-card">
          <form onSubmit={save}>
            <Field label="Email">
              <input required type="email" maxLength={100} value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
            <Field label="Phone">
              <input maxLength={20} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+94 77 123 4567" />
            </Field>
            {role === 'CUSTOMER' && (
              <>
                <Field label="Address">
                  <input maxLength={255} value={address} onChange={e => setAddress(e.target.value)} />
                </Field>
                <Field label="NIC">
                  <input maxLength={12} value={nic} onChange={e => setNic(e.target.value.slice(0, 12))} />
                </Field>
                <Field label="Date of birth">
                  <input
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={dob}
                    onChange={e => {
                      if (e.target.value > new Date().toISOString().slice(0, 10)) {
                        setError('Date of birth cannot be in the future.');
                      } else {
                        setError(null);
                        setDob(e.target.value);
                      }
                    }}
                  />
                </Field>
              </>
            )}
            <button disabled={busy}>Save Profile Details</button>
          </form>
        </Panel>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Panel title="Change password" className="glass-card">
          <form onSubmit={password}>
            <Field label="Current password">
              <PasswordInput required autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </Field>
            <Field label="New password">
              <PasswordInput required minLength={8} maxLength={72} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </Field>
            <p className="fine-print">At least 8 characters and at most 72 UTF-8 bytes. Changing your password signs out all sessions.</p>
            <button disabled={busy}>Change password</button>
          </form>
        </Panel>
      </div>
    </>
  );
}
