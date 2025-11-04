import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Users, ChefHat, BarChart3, Play, Shield, Zap } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export default function HomePage() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">{tCommon('appName')}</span>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            v2.1 - Live in Georgia
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 px-4 py-2">
            {t('badge')}
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl mb-6">
            {t('title')}
            <span className="block text-primary">{t('titleHighlight')}</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground mb-8">
            {t('subtitle')}
          </p>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-12">
            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t('forRestaurants')}</h3>
              <p className="text-sm text-muted-foreground text-center">
                {t('forRestaurantsDesc')}
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t('forDistributors')}</h3>
              <p className="text-sm text-muted-foreground text-center">
                {t('forDistributorsDesc')}
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 rounded-lg border bg-card shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t('forDrivers')}</h3>
              <p className="text-sm text-muted-foreground text-center">
                {t('forDriversDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Auth Section */}
        <section className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t('welcomeBack')}</CardTitle>
              <CardDescription>
                {t('signInOrDemo')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('or')}
                  </span>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/dashboard/demo">
                  <Play className="mr-2 h-4 w-4" />
                  {t('tryDemo')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              {t('trustedBy')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 opacity-70">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('secureReliable')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('realTimeUpdates')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('advancedAnalytics')}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>{t('builtWith')}</p>
            <p className="mt-2">{t('version')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
