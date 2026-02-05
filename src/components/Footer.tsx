'use client';

import { ThemeToggle } from './ThemeToggle';

export function Footer() {
  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] py-4 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-sm text-[var(--foreground-muted)]">
          © {new Date().getFullYear()} Stay Singletrack
        </p>
        <div className="flex items-center gap-4">
          <a 
            href="mailto:hello@staysingletrack.com" 
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Contact
          </a>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
