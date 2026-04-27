import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-10 px-8 border-t border-ink/8">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link href="/" className="font-serif text-xl text-ink">
            LyricSync
          </Link>
          <p className="text-sm text-ink-soft mt-1">Made with ♪ for music lovers</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-ink-soft hover:text-ink transition-colors">
            GitHub
          </a>
          <span className="text-ink-soft/30">|</span>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-sm text-ink-soft hover:text-ink transition-colors">
            Twitter
          </a>
        </div>
        <p className="text-sm text-ink-soft m-0">© 2026</p>
      </div>
    </footer>
  );
}