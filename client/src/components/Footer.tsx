import { Link } from "wouter";
import { Globe, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-t border-gray-200/50 dark:border-gray-700/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-2xl">G</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent">Global Trade Hub</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">B2B Marketplace</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
              The leading B2B marketplace connecting suppliers and buyers worldwide. 
              Get competitive quotes, bulk pricing, and trade assurance.
            </p>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium">190+ Countries Served</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-medium">support@globaltradehub.com</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-medium">+1 (555) 123-4567</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-lg text-gray-900 dark:text-white">For Buyers</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/products" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-products">Products</Link></li>
              <li><Link href="/categories" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-categories">Categories</Link></li>
              <li><Link href="/rfq/create" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-rfq">Post RFQ</Link></li>
              <li><Link href="/buyer-protection" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-protection">Buyer Protection</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-lg text-gray-900 dark:text-white">Marketplace</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/ready-to-ship" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-ready-ship">Ready to Ship</Link></li>
              <li><Link href="/favorites" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-favorites">Favorites</Link></li>
              <li><Link href="/chat" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-chat">Chat Support</Link></li>
              <li><Link href="/track-order" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-track">Track Order</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-lg text-gray-900 dark:text-white">Support</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-help">Help Center</Link></li>
              <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-contact">Contact Us</Link></li>
              <li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-terms">Terms of Use</Link></li>
              <li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium" data-testid="link-footer-privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center md:text-left font-medium">© 2024 Global Trade Hub. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/sitemap" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">Sitemap</Link>
            <Link href="/accessibility" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">Accessibility</Link>
            <Link href="/cookies" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
