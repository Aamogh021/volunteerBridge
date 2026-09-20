/**
 * Volunteer layout — wraps all /volunteer/* routes.
 * Protected to VOLUNTEER role only.
 */

"use client";

import AuthGuard from "@/components/shell/AuthGuard";
import Sidebar from "@/components/shell/Sidebar";
import TopBar from "@/components/shell/TopBar";

export default function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard allowedRoles={["VOLUNTEER"]}>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Sidebar />
        <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TopBar />
          <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
