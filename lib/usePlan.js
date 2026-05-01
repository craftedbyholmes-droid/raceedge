'use client';
import { useState, useEffect } from 'react';
import { getSupabaseClient } from './supabaseClient';

export function usePlan() {
  const [plan, setPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const sb = getSupabaseClient();
        const { data: { session } } = await sb.auth.getSession();
        if (!session) { setLoading(false); return; }
        const res = await fetch('/api/user/plan', {
          headers: { Authorization: 'Bearer ' + session.access_token }
        });
        const d = await res.json();
        setPlan(d.plan || 'free');
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);
  return { plan, loading };
}