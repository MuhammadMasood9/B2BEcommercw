import { Link } from "wouter";
import { Globe, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg sm:text-xl">G</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold">Global Trade Hub</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-md">
              The leading B2B marketplace connecting suppliers and buyers worldwide. 
              Get competitive quotes, bulk pricing, and trade assurance.
            </p>
            <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>190+ Countries Served</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>support@globaltradehub.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">For Buyers</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground" data-testid="link-footer-products">Products</Link></li>
              <li><Link href="/find-suppliers" className="hover:text-foreground" data-testid="link-footer-suppliers">Find Suppliers</Link></li>
              <li><Link href="/rfq/create" className="hover:text-foreground" data-testid="link-footer-rfq">Post RFQ</Link></li>
              <li><Link href="/buyer-protection" className="hover:text-foreground" data-testid="link-footer-protection">Buyer Protection</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">For Suppliers</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link href="/dashboard/supplier" className="hover:text-foreground" data-testid="link-footer-sell">Start Selling</Link></li>
              <li><Link href="/dashboard/supplier" className="hover:text-foreground" data-testid="link-footer-membership">Membership</Link></li>
              <li><Link href="/dashboard/supplier" className="hover:text-foreground" data-testid="link-footer-verification">Get Verified</Link></li>
              <li><Link href="/dashboard/supplier" className="hover:text-foreground" data-testid="link-footer-advertising">Advertising</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-foreground" data-testid="link-footer-help">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-foreground" data-testid="link-footer-contact">Contact Us</Link></li>
              <li><Link href="/terms" className="hover:text-foreground" data-testid="link-footer-terms">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground" data-testid="link-footer-privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-6 sm:mt-10 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">© 2024 Global Trade Hub. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <Link href="/sitemap" className="hover:text-foreground transition-colors">Sitemap</Link>
            <Link href="/accessibility" className="hover:text-foreground transition-colors">Accessibility</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
