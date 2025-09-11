import React from 'react';
import { ThemeProvider } from '@/Contexts/ThemeContext';

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayoutContent({ children }: AuthLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <ThemeProvider>
      <AuthLayoutContent>
        {children}
      </AuthLayoutContent>
    </ThemeProvider>
  );
}
