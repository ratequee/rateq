import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-slate-500">Page not found</p>
      <Link href="/" className="mt-6 inline-block">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
