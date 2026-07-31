'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: '12px',
          padding: '14px 20px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '14px',
        },
        success: {
          style: {
            background: '#16A34A',
            color: '#fff',
          },
        },
        error: {
          style: {
            background: '#DC2626',
            color: '#fff',
          },
        },
      }}
    />
  );
}
