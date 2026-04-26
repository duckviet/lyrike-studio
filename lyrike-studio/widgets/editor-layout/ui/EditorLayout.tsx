"use client";

import { useMemo, useState } from "react";

export interface EditorLayoutProps {
  children: React.ReactNode;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  header?: React.ReactNode;
}

export function EditorLayout({
  children,
  onToggleSidebar,
  isSidebarCollapsed = false,
  header,
}: EditorLayoutProps) {
  return (
    <main className="app-shell">
      <header className="top-header">
        <div className="logo">
          <div className="logo-icon" />
          <h1>Lyrics Studio</h1>
        </div>
        {header}
      </header>

      <div className="app-body">{children}</div>
    </main>
  );
}