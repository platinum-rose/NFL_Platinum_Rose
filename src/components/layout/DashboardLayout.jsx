// src/components/layout/DashboardLayout.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Main Dashboard Layout
// Features a two-column design: 6-Hub Main Content on left + Persistent Multi-Mode AI Sidebar on right
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import PersistentAgentSidebar from '../agent/PersistentAgentSidebar';

export default function DashboardLayout({ children, showAgentSidebar = true }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0a0d14]">
      {/* LEFT COLUMN: MAIN CONTENT (6 COMMAND HUBS) */}
      <div className="flex-1 min-w-0 p-3 md:p-6 overflow-x-hidden">
        {children}
      </div>

      {/* RIGHT COLUMN: PERSISTENT MULTI-MODE AI SIDEBAR */}
      {showAgentSidebar && (
        <PersistentAgentSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}
    </div>
  );
}
