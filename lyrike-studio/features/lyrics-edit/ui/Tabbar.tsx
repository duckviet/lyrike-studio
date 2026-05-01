"use client";

import { cn } from "@/shared/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  className?: string;
}

export function TabBar<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabBarProps<T>) {
  return (
    <div role="tablist" aria-label="Tabs" className={cn(className)}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          label={tab.label}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  );
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "rounded-lg border border-transparent bg-transparent",
        "px-3 py-1.5 text-xs font-bold",
        "cursor-pointer transition-all duration-150",
        "text-ink-light-soft hover:text-ink-light",
        isActive && "bg-bg border-line text-primary shadow-sm",
      )}
    >
      {label}
    </button>
  );
}
