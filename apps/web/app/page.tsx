import Link from 'next/link';

const links = [
  { href: '/setup-doctor', label: '🩺 Setup Doctor', desc: 'Env, DB, GitHub App, Telegram, write-lock status' },
  { href: '/api/setup-doctor', label: '📡 /api/setup-doctor', desc: 'Raw JSON health check' },
  { href: '/api/audit?owner=MelodicBloom&repo=agent-runtime-control-center', label: '🔍 /api/audit', desc: 'Repo metadata + task record (read-only, L0)' },
  { href: '/api/audit/issues?owner=MelodicBloom&repo=agent-runtime-control-center', label: '🐛 /api/audit/issues', desc: 'Open issues list (read-only, L0)' },
];

export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', background: '#0a0b0f', minHeight: '100vh', color: '#e2e4ef', padding: '24px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ color: '#4a5066', fontSize: 12, marginBottom: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>V0 — Read-only</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: '#b06ef3' }}>Jennipher Agent Studio</h1>
        <p style={{ color: '#6c9ef8', fontSize: 14, marginBottom: 32 }}>Phone-controlled creative-technology control center. All mutations locked in V0.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                display: 'block',
                background: '#12141a',
                border: '1px solid #252836',
                borderRadius: 8,
                padding: '14px 16px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: '#3de8c8' }}>{l.label}</div>
              <div style={{ fontSize: 12, color: '#4a5066', marginTop: 3 }}>{l.desc}</div>
            </Link>
          ))}
        </div>

        <p style={{ marginTop: 32, fontSize: 11, color: '#252836' }}>
          WRITE_ACTIONS_ENABLED=false &mdash; L1/L2/L3 gates inactive &mdash; all mutations locked
        </p>
      </div>
    </main>
  );
}
