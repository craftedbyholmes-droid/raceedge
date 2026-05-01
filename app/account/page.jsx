'use client';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { usePlan } from '@/lib/usePlan';

export default function AccountPage() {
  const sb = getSupabaseClient();
  const [user, setUser] = useState(null);
  const { plan } = usePlan();

  useEffect(() => {
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  const signOut = async () => {
    await sb.auth.signOut();
    window.location.href = '/';
  };

  if (!user) return (
    <div style={{ paddingTop: 32, textAlign: 'center', color: 'var(--muted)' }}>
      <a href="/" style={{ color: 'var(--blue)' }}>Sign in</a> to view your account.
    </div>
  );

  const planColour = { free: 'var(--muted)', pro: 'var(--blue)', edge: 'var(--green)' };
  const planLabel  = { free: 'Free', pro: 'Pro - £9.99/month', edge: 'Edge - £24.99/month' };

  return (
    <div style={{ paddingTop: 16 }}>
      <h1 className="section-title">Account</h1>
      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Email</div>
          <div>{user.email}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Plan</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: planColour[plan] || 'var(--text)' }}>
            {planLabel[plan] || plan}
          </div>
        </div>
        {plan === 'free' && (
          <a href="/pricing" className="btn btn-blue btn-full" style={{ marginBottom: 12 }}>Upgrade Plan</a>
        )}
        <button onClick={signOut} className="btn btn-ghost btn-full">Sign Out</button>
      </div>
    </div>
  );
}