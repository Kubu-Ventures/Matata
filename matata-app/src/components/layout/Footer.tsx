import Link from 'next/link'

export function Footer() {
  return (
    <footer id="about" className="border-t border-border bg-foreground text-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
        <div>
          <p className="text-xl font-bold tracking-tight">Matata</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-background/70">Matata helps communities map disasters and share reliable information for coordinated response.</p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold">Crisis Response</p>
          <Link href="#report" className="text-background/70 hover:text-background">Report a crisis</Link>
          <Link href="#how-it-works" className="text-background/70 hover:text-background">How it works</Link>
          <Link href="#resources" className="text-background/70 hover:text-background">Resources</Link>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-semibold">About Matata</p>
          <Link href="#top" className="text-background/70 hover:text-background">Back to the start</Link>
          <p className="text-background/50">This service does not replace emergency services.</p>
        </div>
      </div>
      <div className="border-t border-background/20 px-6 py-5 text-xs text-background/60 lg:px-10">© {new Date().getFullYear()} Matata</div>
    </footer>
  )
}
