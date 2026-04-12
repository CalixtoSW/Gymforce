'use client';

import { useQuery } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import type { User } from '@/types';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const meQuery = useQuery({
    queryKey: ['admin-me'],
    queryFn: () => api.get<User>('/auth/me').then((response) => response.data),
    enabled: isAuthenticated(),
    retry: false,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (meQuery.isSuccess && meQuery.data.role !== 'admin' && meQuery.data.role !== 'recepcao') {
      router.replace('/login');
    }
  }, [meQuery.data, meQuery.isSuccess, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header userName={meQuery.data?.name} userRole={meQuery.data?.role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
