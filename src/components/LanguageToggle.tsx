import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="gap-2 text-inherit hover:bg-accent/20"
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">{language === 'en' ? 'हिंदी' : 'EN'}</span>
    </Button>
  );
}