import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  // Common
  'app.name': string;
  'app.tagline': string;
  
  // Navigation
  'nav.menu': string;
  'nav.orders': string;
  'nav.feedback': string;
  'nav.settings': string;
  'nav.dashboard': string;
  
  // Menu
  'menu.drinks': string;
  'menu.snacks': string;
  'menu.meals': string;
  'menu.available': string;
  'menu.soldOut': string;
  'menu.add': string;
  'menu.comingSoon': string;
  
  // Cart
  'cart.title': string;
  'cart.empty': string;
  'cart.total': string;
  'cart.yourName': string;
  'cart.namePlaceholder': string;
  'cart.placeOrder': string;
  'cart.placingOrder': string;
  'cart.payAtCounter': string;
  
  // Order
  'order.placed': string;
  'order.showAtCounter': string;
  'order.orderMore': string;
  'order.orderId': string;
  'order.receipt': string;
  'order.thankYou': string;
  
  // Staff Dashboard
  'staff.liveOrders': string;
  'staff.todaysEarnings': string;
  'staff.topSelling': string;
  'staff.noOrders': string;
  'staff.pending': string;
  'staff.preparing': string;
  'staff.completed': string;
  'staff.menuManager': string;
  'staff.addItem': string;
  'staff.editItem': string;
  'staff.deleteItem': string;
  'staff.availability': string;
  
  // Feedback
  'feedback.title': string;
  'feedback.submit': string;
  'feedback.thanks': string;
}

const translations: Record<Language, Translations> = {
  en: {
    'app.name': 'Menio',
    'app.tagline': 'Your Digital Cafe Hub',
    
    'nav.menu': 'Menu',
    'nav.orders': 'Orders',
    'nav.feedback': 'Feedback',
    'nav.settings': 'Settings',
    'nav.dashboard': 'Dashboard',
    
    'menu.drinks': 'Drinks',
    'menu.snacks': 'Snacks',
    'menu.meals': 'Meals',
    'menu.available': 'available',
    'menu.soldOut': 'Sold Out',
    'menu.add': 'Add',
    'menu.comingSoon': 'Menu coming soon!',
    
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.total': 'Total',
    'cart.yourName': 'Your Name (optional)',
    'cart.namePlaceholder': 'For order pickup',
    'cart.placeOrder': 'Place Order at Counter',
    'cart.placingOrder': 'Placing Order...',
    'cart.payAtCounter': 'Pay at the counter after placing your order',
    
    'order.placed': 'Order Placed!',
    'order.showAtCounter': 'Show this at the counter for payment',
    'order.orderMore': 'Order More',
    'order.orderId': 'Order ID',
    'order.receipt': 'Digital Receipt',
    'order.thankYou': 'Thank you for your order!',
    
    'staff.liveOrders': 'Live Orders',
    'staff.todaysEarnings': "Today's Earnings",
    'staff.topSelling': 'Top Selling',
    'staff.noOrders': 'No orders today',
    'staff.pending': 'Pending',
    'staff.preparing': 'Preparing',
    'staff.completed': 'Completed',
    'staff.menuManager': 'Menu Manager',
    'staff.addItem': 'Add Item',
    'staff.editItem': 'Edit Item',
    'staff.deleteItem': 'Delete',
    'staff.availability': 'Available',
    
    'feedback.title': 'Share Your Feedback',
    'feedback.submit': 'Submit Feedback',
    'feedback.thanks': 'Thank you for your feedback!',
  },
  hi: {
    'app.name': 'मेनीयो',
    'app.tagline': 'आपका डिजिटल कैफ़े हब',
    
    'nav.menu': 'मेन्यू',
    'nav.orders': 'ऑर्डर',
    'nav.feedback': 'फीडबैक',
    'nav.settings': 'सेटिंग्स',
    'nav.dashboard': 'डैशबोर्ड',
    
    'menu.drinks': 'ड्रिंक्स',
    'menu.snacks': 'स्नैक्स',
    'menu.meals': 'मील्स',
    'menu.available': 'उपलब्ध',
    'menu.soldOut': 'बिक गया',
    'menu.add': 'जोड़ें',
    'menu.comingSoon': 'मेन्यू जल्द आ रहा है!',
    
    'cart.title': 'आपकी कार्ट',
    'cart.empty': 'आपकी कार्ट खाली है',
    'cart.total': 'कुल',
    'cart.yourName': 'आपका नाम (वैकल्पिक)',
    'cart.namePlaceholder': 'ऑर्डर पिकअप के लिए',
    'cart.placeOrder': 'काउंटर पर ऑर्डर दें',
    'cart.placingOrder': 'ऑर्डर दिया जा रहा है...',
    'cart.payAtCounter': 'ऑर्डर देने के बाद काउंटर पर भुगतान करें',
    
    'order.placed': 'ऑर्डर हो गया!',
    'order.showAtCounter': 'भुगतान के लिए यह काउंटर पर दिखाएं',
    'order.orderMore': 'और ऑर्डर करें',
    'order.orderId': 'ऑर्डर आईडी',
    'order.receipt': 'डिजिटल रसीद',
    'order.thankYou': 'आपके ऑर्डर के लिए धन्यवाद!',
    
    'staff.liveOrders': 'लाइव ऑर्डर्स',
    'staff.todaysEarnings': 'आज की कमाई',
    'staff.topSelling': 'सबसे ज्यादा बिकने वाला',
    'staff.noOrders': 'आज कोई ऑर्डर नहीं',
    'staff.pending': 'लंबित',
    'staff.preparing': 'तैयार हो रहा',
    'staff.completed': 'पूर्ण',
    'staff.menuManager': 'मेन्यू मैनेजर',
    'staff.addItem': 'आइटम जोड़ें',
    'staff.editItem': 'आइटम एडिट करें',
    'staff.deleteItem': 'हटाएं',
    'staff.availability': 'उपलब्ध',
    
    'feedback.title': 'अपनी राय साझा करें',
    'feedback.submit': 'फीडबैक सबमिट करें',
    'feedback.thanks': 'आपकी प्रतिक्रिया के लिए धन्यवाद!',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'menio-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      return (saved === 'hi' ? 'hi' : 'en') as Language;
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: keyof Translations): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'hi' || saved === 'en') {
      setLanguageState(saved);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}