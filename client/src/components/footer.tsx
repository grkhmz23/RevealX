import { Link } from 'wouter';
import { BRAND_NAME, FOOTER_LINKS, GLOBAL_NOTICES } from '@/config/brand';
import { ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-neon-cyan/30 bg-dark-purple/20 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold text-neon-cyan mb-4">{BRAND_NAME}</h3>
            <p className="text-gray-400 text-sm mb-4">
              A Solana-native casino platform offering scratch cards, slots, and more. 
              Experience fair gaming with transparent blockchain transactions.
            </p>
            <div className="text-xs text-gray-500 bg-dark-purple/40 p-3 rounded border border-neon-cyan/20">
              <p className="mb-1">{GLOBAL_NOTICES.gambling}</p>
              <p>{GLOBAL_NOTICES.poolSplit}</p>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-lg font-semibold text-neon-cyan mb-4">Legal</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-gray-400 hover:text-neon-cyan transition-colors cursor-pointer text-sm">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="text-lg font-semibold text-neon-cyan mb-4">Community</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.social.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a 
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-neon-cyan transition-colors text-sm flex items-center space-x-1"
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link href={link.href}>
                      <span className="text-gray-400 hover:text-neon-cyan transition-colors cursor-pointer text-sm">
                        {link.label}
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neon-cyan/20 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2025 {BRAND_NAME}. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Powered by Solana blockchain</p>
        </div>
      </div>
    </footer>
  );
}