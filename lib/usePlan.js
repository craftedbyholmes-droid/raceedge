'use client';

import { useState, useEffect } from 'react';
import supabaseClient from './supabaseClient.js';

export function usePlan() {
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(function() {
    let mounted = true;

    async function loadPlan() {
      try {
        const sessionData = await supabaseClient.auth.getSession();
        const session = sessionData.data.session;
        if (!session || !mounted) { setLoading(false); return; }
        setUser(session.user);
        const res = await fetch('/api/user/plan', {
          headers: { Authorization: 'Bearer ' + session.access_token },
        });
        if (res.ok && mounted) {
          const data = await res.json();
          setPlan(data.plan || 'free');
        }
      } catch (err) {
        console.error('usePlan error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPlan();

    const authSub = supabaseClient.auth.onAuthStateChange(function() { loadPlan(); });

    return function() {
      mounted = false;
      if (authSub.data && authSub.data.subscription) authSub.data.subscription.unsubscribe();
    };
  }, []);

  return { plan, loading, user };
}