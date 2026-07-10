'use client';

import { useEffect, useState } from 'react';

type CheckStatus = 'ok' | 'missing' | 'error' | 'disabled';

interface HealthCheck {
  name: string;
  status: CheckStatus;
  detail?: string;
}

interface DoctorResult {
  ok: boolean;
  summary: string;
  timestamp: string;
  checks: HealthCheck[];
}

const STATUS_ICON: Record<CheckStatus, string> = {
  ok: '✅',
  missing: '❌',
  error: '🔴',
  disabled: '🔒',
};

const STATUS_COLOR: Record<CheckStatus, string> = {
  ok: '#22d3a0',
  missing: '#e85454',
  error: '#e85454',
  disabled: '#f5a623',
};

export default function SetupDoctorPage() {
  const [data, setData] = useState<DoctorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/setup-doctor')
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#0a0b0f', minHeight: '100vh', color: '#e2e4ef', padding: '24px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ color: '#4a5066', fontSize: 12, marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Jennipher Agent Studio</p>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: '#b06ef3' }}>Setup Doctor</h1>
        <p style={{ color: '#6c9ef8', fontSize: 13, marginBottom: 24 }}>Read-only environment health check — L0, no side effects</p>

        {loading && <p style={{ color: '#4a5066' }}>Running checks…</p>}
        {error && <p style={{ color: '#e85454' }}>Error: {error}</p>}

        {data && (
          <>
            <div style={{
              background: '#12141a',
              border: `1px solid ${data.ok ? '#22d3a0' : '#e85454'}`,
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>{data.ok ? '✅' : '⚠️'}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{data.summary}</div>
                <div style={{ color: '#4a5066', fontSize: 11 }}>{new Date(data.timestamp).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.checks.map((check) => (
                <div
                  key={check.name}
                  style={{
                    background: '#12141a',
                    border: '1px solid #252836',
                    borderRadius: 6,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1.4 }}>{STATUS_ICON[check.status]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: STATUS_COLOR[check.status] }}>{check.name}</div>
                    {check.detail && (
                      <div style={{ fontSize: 11, color: '#4a5066', marginTop: 2, wordBreak: 'break-all' }}>{check.detail}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
