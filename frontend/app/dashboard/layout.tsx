"use client";
import AuthGuard from "@/components/shell/AuthGuard";
import Sidebar from "@/components/shell/Sidebar";
import TopBar from "@/components/shell/TopBar";
import CommandBar from "@/components/command/CommandBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["NGO_ADMIN"]}>
      {/* Command Bar — available on every dashboard page */}
      <CommandBar />

      {/* Outer wrapper */}
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        {/* Sidebar (icon-only, 72px) */}
        <Sidebar />

        {/* Main content area */}
        <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar />

          <main
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '32px',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}