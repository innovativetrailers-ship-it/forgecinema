import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="bg-[#080c12] border-t border-[#1a2030] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
          <div className="max-w-xs">
            <div className="text-[#00e5c8] font-bold text-lg mb-1">Cinematic Forge</div>
            <p className="text-gray-500 text-xs mb-2">by INNOVATIVE</p>
            <p className="text-gray-600 text-xs leading-relaxed">
              Professional AI film production for creators, studios, and storytellers worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Changelog'].map((l) => (
                  <li key={l}>
                    <Link href="#" className="text-gray-500 hover:text-[#00e5c8] text-xs transition">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Contact'].map((l) => (
                  <li key={l}>
                    <Link href="#" className="text-gray-500 hover:text-[#00e5c8] text-xs transition">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Terms', href: '/terms' },
                  { label: 'Privacy', href: '/privacy' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-gray-500 hover:text-[#00e5c8] text-xs transition">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1a2030] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} INNOVATIVE. All rights reserved.
          </p>
          <p className="text-gray-700 text-xs">cinematicforge.ai</p>
        </div>
      </div>
    </footer>
  )
}
