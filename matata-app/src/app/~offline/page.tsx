// app/~offline/page.tsx
export default function Offline() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-xl font-semibold text-[#232E3D] mb-2">You're offline</h1>
      <p className="text-sm text-[#55606E]">
        Matata needs a connection for this page. Your saved reports will sync once you're back online.
      </p>
    </div>
  );
}
