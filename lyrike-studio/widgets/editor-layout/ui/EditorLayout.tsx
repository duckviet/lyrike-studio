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
    <main className="flex flex-col overflow-hidden h-[calc(100vh-60px)] w-full bg-transparent">
      {header && (
        <header className="top-header">
          <div className="logo">
            <div className="logo-icon" />
            <h1>Lyrics Studio</h1>
          </div>
          {header}
        </header>
      )}

      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </main>
  );
}