'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

const LOCALE_STORAGE_KEY = 'preferred-locale';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Save locale preference to localStorage
  const saveLocalePreference = (newLocale: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch (error) {
      console.error('Failed to save locale preference:', error);
    }
  };

  const changeLocale = (newLocale: Locale) => {
    // Save preference
    saveLocalePreference(newLocale);

    // Remove current locale from pathname
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace locale segment

    // Navigate to new locale
    router.push(segments.join('/'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => changeLocale(loc)}
            className={locale === loc ? 'bg-accent' : ''}
          >
            <span className="mr-2">{localeFlags[loc]}</span>
            {localeNames[loc]}
            {locale === loc && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hook to get and restore user's preferred locale from localStorage
 * Use this in your root layout or pages to restore user's language preference
 */
export function useLocalePreference(): Locale | null {
  const [preferredLocale, setPreferredLocale] = React.useState<Locale | null>(null);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && locales.includes(stored as Locale)) {
        setPreferredLocale(stored as Locale);
      }
    } catch (error) {
      console.error('Failed to get locale preference:', error);
    }
  }, []);

  return preferredLocale;
}
