'use client';

import { useDemo } from '@/hooks/useDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Package, Truck, BarChart3, Clock, Star } from 'lucide-react';

export default function DemoDashboard() {
  const { currentRole, sampleData, analyticsData, isLoading } = useDemo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Users className="h-5 w-5" />;
      case 'restaurant': return <Package className="h-5 w-5" />;
      case 'driver': return <Truck className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'restaurant': return 'bg-green-100 text-green-800';
      case 'driver': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to Georgian Distribution Demo
            </h1>
            <p className="text-gray-600 mt-1">
              Experience our comprehensive food delivery management system from different perspectives
            </p>
          </div>
          <Badge className={`${getRoleColor(currentRole)} flex items-center gap-2`}>
            {getRoleIcon(currentRole)}
            {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} View
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.total_orders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analyticsData.monthly_growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₾{analyticsData.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Restaurants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.active_restaurants}</div>
            <p className="text-xs text-muted-foreground">
              {sampleData.users.filter(u => u.role === 'restaurant').length} in demo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.active_drivers}</div>
            <p className="text-xs text-muted-foreground">
              {sampleData.users.filter(u => u.role === 'driver').length} in demo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role-Specific Content */}
      <Tabs value={currentRole} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Admin Dashboard
          </TabsTrigger>
          <TabsTrigger value="restaurant" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Restaurant Dashboard
          </TabsTrigger>
          <TabsTrigger value="driver" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Driver Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Overview</CardTitle>
              <CardDescription>
                Manage users, products, orders, and system analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-gray-600">Manage restaurants, drivers, and admins</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Product Catalog</h3>
                  <p className="text-sm text-gray-600">Oversee menu items and pricing</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-sm text-gray-600">Track performance and insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restaurant" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Overview</CardTitle>
              <CardDescription>
                Manage your menu, process orders, and track deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Menu Management</h3>
                  <p className="text-sm text-gray-600">Update your product catalog</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Order Processing</h3>
                  <p className="text-sm text-gray-600">Handle incoming orders</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Truck className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Delivery Tracking</h3>
                  <p className="text-sm text-gray-600">Monitor order status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driver Overview</CardTitle>
              <CardDescription>
                Accept deliveries, track routes, and manage earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Truck className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Delivery Management</h3>
                  <p className="text-sm text-gray-600">Accept and complete deliveries</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Route Optimization</h3>
                  <p className="text-sm text-gray-600">Efficient delivery routes</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Earnings Tracker</h3>
                  <p className="text-sm text-gray-600">Monitor your income</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sample Data Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Data Overview</CardTitle>
          <CardDescription>
            Preview of the demo data available in this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{sampleData.users.length}</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{sampleData.products.length}</div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{sampleData.orders.length}</div>
              <div className="text-sm text-gray-600">Orders</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{sampleData.deliveries.length}</div>
              <div className="text-sm text-gray-600">Deliveries</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}