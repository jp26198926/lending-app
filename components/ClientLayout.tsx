"use client";

import { AuthProvider } from "@/context/AuthContext";
import Nav from "@/components/nav";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Nav />
      <main>{children}</main>
    </AuthProvider>
  );
}
