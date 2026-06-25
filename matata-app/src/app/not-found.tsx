import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-white">
      <div className="w-12 h-12 bg-[#006EB5] rounded flex items-center justify-center mb-6">
        <span className="text-white font-bold text-lg">M</span>
      </div>
      <h1 className="text-3xl font-bold text-[#232E3D] mb-2">Page not found</h1>
      <p className="text-[#55606E] mb-6">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-[#006EB5] text-white text-sm font-medium rounded hover:bg-[#005a94] transition-colors"
      >
        Return home
      </Link>
    </div>
  );
}
