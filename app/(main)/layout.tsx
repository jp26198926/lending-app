"use client";

import Sidebar from "@/components/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-zentyal-light overflow-hidden">
      <Sidebar />
      {/* Main content area with responsive margin */}
      <main className="flex-1 overflow-y-auto lg:ml-64 transition-all duration-300">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
