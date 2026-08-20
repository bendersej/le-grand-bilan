import { Link } from '@tanstack/react-router'

export default function Modal({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50">
      <Link
        to="/"
        search={(previousSearch) => previousSearch}
        resetScroll={false}
        aria-label="Fermer"
        className="absolute inset-0 block bg-[rgba(10,10,28,0.45)]"
      />
      <div className="absolute inset-x-0 top-[8vh] mx-auto max-h-[84vh] w-[min(680px,calc(100%-2rem))] overflow-y-auto rounded-xl border border-[var(--line)] bg-[var(--bg-base)] p-6 sm:p-8">
        <div className="flex justify-end">
          <Link
            to="/"
            search={(previousSearch) => previousSearch}
            resetScroll={false}
            className="nav-link text-sm"
          >
            Fermer ✕
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
