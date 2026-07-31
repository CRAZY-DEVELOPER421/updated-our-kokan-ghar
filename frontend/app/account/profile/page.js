'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '@/lib/store/authStore';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateProfile, fetchProfile } = useAuthStore();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);

  const PASSWORD_REQUIREMENTS = [
    { label: 'At least 6 characters', test: (p) => p.length >= 6 },
    { label: 'Contains a number', test: (p) => /\d/.test(p) },
    { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
    { label: 'Contains a special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
  ];

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_REQUIREMENTS.filter((req) => req.test(passwordForm.newPass)).length;
    if (passed === 0) return { label: 'Weak', color: '#DC2626', width: '25%' };
    if (passed <= 2) return { label: 'Fair', color: '#E87722', width: '50%' };
    if (passed === 3) return { label: 'Good', color: '#F4A261', width: '75%' };
    return { label: 'Strong', color: '#16A34A', width: '100%' };
  }, [passwordForm.newPass]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const validate = () => {
    const errs = {};
    if (!profile.name.trim()) errs.name = t('account.name_required');
    if (!profile.email.trim()) errs.email = t('account.email_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = t('account.email_invalid');
    if (profile.phone && !/^\d{10}$/.test(profile.phone.replace(/\D/g, ''))) errs.phone = t('account.phone_invalid');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    const res = await updateProfile(profile);
    setSaving(false);
    if (res.success) {
      toast.success(t('account.profile_updated'));
    } else {
      toast.error(res.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.current.trim()) return toast.error(t('account.enter_current_password'));
    if (passwordForm.newPass.length < 6) return toast.error(t('account.password_min_length'));
    if (passwordForm.newPass !== passwordForm.confirm) return toast.error(t('account.passwords_mismatch'));
    setChangingPassword(true);
    try {
      const api = (await import('@/lib/api')).default;
      const res = await api.put('/users/change-password', {
        current_password: passwordForm.current,
        new_password: passwordForm.newPass,
      });
      if (res.data.success) {
        toast.success(t('account.password_changed'));
        setShowPasswordModal(false);
        setPasswordForm({ current: '', newPass: '', confirm: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    }
    setChangingPassword(false);
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl card p-6 space-y-4">
        <Skeleton variant="heading" />
        <Skeleton variant="title" />
        <Skeleton variant="text" />
        <Skeleton variant="button" />
      </div>
    );
  }

  const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <div className="bg-white rounded-2xl card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-konkan-green-primary flex items-center justify-center text-white font-display text-2xl font-bold">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-konkan-text-primary">{user.name}</h2>
            <p className="text-sm text-konkan-text-secondary">{t('account.member_since', { date: joinedDate })}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('account.full_name')}
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            error={errors.name}
            required
          />
          <Input
            label={t('account.email')}
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            error={errors.email}
            required
          />
          <Input
            label={t('account.phone_optional')}
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            error={errors.phone}
            placeholder={t('account.phone_placeholder')}
          />

          <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
            <Button type="submit" loading={saving}>{t('account.save_changes')}</Button>
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="text-sm text-konkan-green-primary hover:underline font-medium"
            >
              {t('account.change_password')}
            </button>
          </div>
        </form>
      </div>

      {/* Language Settings */}
      <div className="bg-white rounded-2xl card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-konkan-text-primary">{t('account.language_settings')}</h3>
            <p className="text-sm text-konkan-text-secondary mt-0.5">{t('account.select_language')}</p>
          </div>
          <LanguageSwitcher variant="dropdown" />
        </div>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('account.orders_count'), value: user.order_count || 0 },
          { label: t('account.wishlist_count'), value: user.wishlist_count || 0 },
          { label: t('account.reviews_count'), value: user.review_count || 0 },
          { label: t('account.points_count'), value: user.loyalty_points || 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl card p-4 text-center">
            <p className="font-bold text-lg text-konkan-text-primary">{stat.value}</p>
            <p className="text-xs text-konkan-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title={t('account.change_password')} size="sm">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label={t('account.current_password')}
            type={showPasswords ? 'text' : 'password'}
            value={passwordForm.current}
            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
            required
          />
          <div>
            <Input
              label={t('account.new_password')}
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.newPass}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
              required
              placeholder={t('account.password_min_length')}
            />

            {/* Password Strength Meter */}
            {passwordForm.newPass && (
              <div className="mt-2 space-y-1.5">
                <div className="h-1.5 bg-konkan-sand rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {PASSWORD_REQUIREMENTS.map((req, idx) => {
                    const met = req.test(passwordForm.newPass);
                    return (
                      <li key={idx} className={`flex items-center gap-1.5 text-xs ${met ? 'text-konkan-success' : 'text-konkan-text-secondary'}`}>
                        <svg className="w-3 h-3 shrink-0" fill={met ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          {met ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <circle cx="12" cy="12" r="10" strokeWidth={2} />
                          )}
                        </svg>
                        {req.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <Input
            label={t('account.confirm_password')}
            type={showPasswords ? 'text' : 'password'}
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            error={passwordForm.confirm && passwordForm.newPass !== passwordForm.confirm ? t('account.passwords_mismatch') : ''}
            required
          />
          <label className="flex items-center gap-1.5 text-xs text-konkan-text-secondary cursor-pointer -mt-1">
            <input
              type="checkbox"
              id="show-password-change"
              checked={showPasswords}
              onChange={() => setShowPasswords(!showPasswords)}
              className="rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary"
            />
            Show passwords
          </label>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={changingPassword}>{t('account.update_password')}</Button>
            <Button variant="outline" type="button" onClick={() => setShowPasswordModal(false)}>{t('account.cancel')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
