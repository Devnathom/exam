'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/admin/dashboard');
    } else {
      router.push('/auth/login');
    }
  }, [router]);

  return null;
}
