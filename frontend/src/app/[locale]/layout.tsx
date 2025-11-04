import type { Metadata } from "next";
import { Inter, Roboto_Mono, Noto_Sans_Georgian } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Providers } from '../providers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { locales, getLocaleDirection, type Locale } from '@/i18n/config';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian", "latin"],
  display: "swap",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const messages = await getMessages({ locale });
  const meta = messages.meta as { title: string; description: string };

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
      locale: locale === 'ka' ? 'ka_GE' : 'en_US',
      siteName: 'Georgian Distribution System',
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'ka': '/ka',
        'en': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();
  const direction = getLocaleDirection(locale as Locale);

  return (
    <html lang={locale} dir={direction}>
      <body
        className={`${inter.variable} ${robotoMono.variable} ${notoSansGeorgian.variable} antialiased`}
        style={{
          fontFamily: locale === 'ka'
            ? 'var(--font-noto-georgian), var(--font-inter), sans-serif'
            : 'var(--font-inter), sans-serif',
        }}
      >
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <Providers>
              {children}
            </Providers>
          </NextIntlClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
