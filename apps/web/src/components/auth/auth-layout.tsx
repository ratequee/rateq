'use client';

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'login' | 'register';
}

export function AuthLayout({ children }: AuthLayoutProps) {

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:grid lg:grid-cols-1 bg-brand-500">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8">{children}</div>
      </div>
    </div>
  );
}
