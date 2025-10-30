'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Play, Users, Package, Truck, BarChart3 } from 'lucide-react';
import { useDemo } from '@/hooks/useDemo';

interface DemoOnboardingProps {
  onComplete: () => void;
}

export function DemoOnboarding({ onComplete }: DemoOnboardingProps) {
  const { startTour, switchRole } = useDemo();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Georgian Distribution',
      description: 'Experience our comprehensive food delivery management system',
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Our platform connects restaurants, drivers, and customers in a seamless delivery ecosystem.
            This demo will show you how each role interacts with the system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Admin</h3>
              <p className="text-sm text-gray-600">System oversight</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Restaurant</h3>
              <p className="text-sm text-gray-600">Menu & orders</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Truck className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold">Driver</h3>
              <p className="text-sm text-gray-600">Deliveries</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Interactive Demo Experience',
      description: 'Switch between roles and explore features',
      icon: Play,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Use the role switcher at the top to experience the system from different perspectives.
            Each role has unique dashboards and capabilities.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
              <span className="text-sm">Manage users, monitor analytics, oversee operations</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Badge className="bg-green-100 text-green-800">Restaurant</Badge>
              <span className="text-sm">Update menus, process orders, track deliveries</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Badge className="bg-orange-100 text-orange-800">Driver</Badge>
              <span className="text-sm">Accept deliveries, optimize routes, track earnings</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Key Features Overview',
      description: 'Discover what makes our platform powerful',
      icon: BarChart3,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Our system includes comprehensive features for efficient food delivery management.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Real-time Updates</h4>
              <p className="text-sm text-gray-600">Live order tracking and status updates</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Analytics Dashboard</h4>
              <p className="text-sm text-gray-600">Comprehensive reporting and insights</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Mobile Optimized</h4>
              <p className="text-sm text-gray-600">Works perfectly on all devices</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Secure & Reliable</h4>
              <p className="text-sm text-gray-600">Enterprise-grade security</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Start the guided tour
      startTour();
      onComplete();
    }
  };

  const handleSkip = () => {
    startTour();
    onComplete();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{currentStepData.description}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip
            </Button>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStepData.content}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}

              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Start Demo Tour' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}