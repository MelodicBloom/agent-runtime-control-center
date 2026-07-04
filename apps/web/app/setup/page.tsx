async function getSetupDoctorReport() {
  return {
    title: "Setup Wizard",
    message:
      "Use /api/setup-doctor with your CONTROL_PLANE_API_KEY or GATEWAY_DASHBOARD_KEY to fetch live configuration status. This page is the visual shell for the startup wizard.",
    steps: [
      "Add required environment variables in Vercel.",
      "Add GitHub Actions repository secrets.",
      "Create protected GitHub environments.",
      "Deploy the app to Vercel.",
      "Call /api/setup-doctor to verify readiness.",
      "Call /api/gateway/commands to submit a test /audit task.",
    ],
  };
}

export default async function SetupPage() {
  const report = await getSetupDoctorReport();

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui" }}>
      <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>
        Jennipher Agent Studio
      </p>
      <h1>{report.title}</h1>
      <p style={{ fontSize: 18, lineHeight: 1.6 }}>{report.message}</p>
      <section style={{ marginTop: 32 }}>
        <h2>Startup sequence</h2>
        <ol style={{ lineHeight: 1.8 }}>
          {report.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
      <section style={{ marginTop: 32, padding: 24, border: "1px solid #ddd", borderRadius: 16 }}>
        <h2>Live check endpoint</h2>
        <code>/api/setup-doctor</code>
        <p>
          Send an Authorization bearer token using CONTROL_PLANE_API_KEY or GATEWAY_DASHBOARD_KEY.
        </p>
      </section>
    </main>
  );
}
