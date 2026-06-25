'use client';

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'login' | 'register';
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-brand-500 dark:bg-slate-950 lg:grid lg:grid-cols-1">
      <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-transparent bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          {children}
        </div>
      </div>
    </div>
  );
}
