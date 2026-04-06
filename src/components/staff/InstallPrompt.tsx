import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, showIOSInstructions } = usePWAInstall();

  if (isInstalled) {
    return null;
  }

  if (showIOSInstructions) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-1">Install Menio</h3>
              <p className="text-xs text-muted-foreground">
                Tap the <span className="font-semibold">Share</span> button, then <span className="font-semibold">"Add to Home Screen"</span> for the best experience.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm">Install Menio</h3>
            <p className="text-xs text-muted-foreground">
              Get quick access from your home screen
            </p>
          </div>
          <Button variant="cafe" size="sm" onClick={promptInstall}>
            Install
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}