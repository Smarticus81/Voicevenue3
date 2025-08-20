"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data - in real app this would come from your backend
const usageData = {
  currentMonth: {
    calls: 1247,
    messages: 3421,
    aiMinutes: 89.5,
    cost: 156.78
  },
  lastMonth: {
    calls: 1189,
    messages: 3156,
    aiMinutes: 82.3,
    cost: 142.45
  },
  limits: {
    calls: 2000,
    messages: 5000,
    aiMinutes: 100,
    cost: 200
  }
};

const activeAddons = [
  {
    name: 'Advanced Voice Processing',
    description: 'Enhanced voice recognition and natural language processing',
    cost: 29.99,
    status: 'active',
    usage: 85
  },
  {
    name: 'Multi-Language Support',
    description: 'Support for Spanish, French, and German',
    cost: 19.99,
    status: 'active',
    usage: 45
  },
  {
    name: 'Calendar Integration',
    description: 'Google Calendar and Outlook sync',
    cost: 14.99,
    status: 'active',
    usage: 92
  },
  {
    name: 'Payment Processing',
    description: 'Stripe and Square integration',
    cost: 24.99,
    status: 'active',
    usage: 67
  }
];

const costBreakdown = [
  { category: 'Voice Calls', amount: 89.45, percentage: 57 },
  { category: 'AI Processing', amount: 45.23, percentage: 29 },
  { category: 'Add-ons', amount: 22.10, percentage: 14 }
];

const usageHistory = [
  { month: 'Jan', calls: 890, messages: 2100, cost: 125.50 },
  { month: 'Feb', calls: 1020, messages: 2450, cost: 138.75 },
  { month: 'Mar', calls: 1189, messages: 3156, cost: 142.45 },
  { month: 'Apr', calls: 1247, messages: 3421, cost: 156.78 }
];

export default function UsagePage() {
  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400';
    if (percentage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Usage & Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor your usage, costs, and active add-ons
          </p>
        </div>

        {/* Current Month Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Voice Calls This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageData.currentMonth.calls.toLocaleString()}
              </div>
              <div className="flex items-center mt-2">
                <Progress 
                  value={getUsagePercentage(usageData.currentMonth.calls, usageData.limits.calls)} 
                  className="flex-1 mr-2"
                />
                <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usageData.currentMonth.calls, usageData.limits.calls))}`}>
                  {Math.round(getUsagePercentage(usageData.currentMonth.calls, usageData.limits.calls))}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {usageData.limits.calls.toLocaleString()} limit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Messages This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageData.currentMonth.messages.toLocaleString()}
              </div>
              <div className="flex items-center mt-2">
                <Progress 
                  value={getUsagePercentage(usageData.currentMonth.messages, usageData.limits.messages)} 
                  className="flex-1 mr-2"
                />
                <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usageData.currentMonth.messages, usageData.limits.messages))}`}>
                  {Math.round(getUsagePercentage(usageData.currentMonth.messages, usageData.limits.messages))}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {usageData.limits.messages.toLocaleString()} limit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                AI Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {usageData.currentMonth.aiMinutes}h
              </div>
              <div className="flex items-center mt-2">
                <Progress 
                  value={getUsagePercentage(usageData.currentMonth.aiMinutes, usageData.limits.aiMinutes)} 
                  className="flex-1 mr-2"
                />
                <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usageData.currentMonth.aiMinutes, usageData.limits.aiMinutes))}`}>
                  {Math.round(getUsagePercentage(usageData.currentMonth.aiMinutes, usageData.limits.aiMinutes))}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {usageData.limits.aiMinutes}h limit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Cost This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${usageData.currentMonth.cost}
              </div>
              <div className="flex items-center mt-2">
                <Progress 
                  value={getUsagePercentage(usageData.currentMonth.cost, usageData.limits.cost)} 
                  className="flex-1 mr-2"
                />
                <span className={`text-sm font-medium ${getUsageColor(getUsagePercentage(usageData.currentMonth.cost, usageData.limits.cost))}`}>
                  {Math.round(getUsagePercentage(usageData.currentMonth.cost, usageData.limits.cost))}%
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of ${usageData.limits.cost} budget
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="addons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="addons">Active Add-ons</TabsTrigger>
            <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="history">Usage History</TabsTrigger>
          </TabsList>

          <TabsContent value="addons" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeAddons.map((addon) => (
                <Card key={addon.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Active
                      </Badge>
                    </div>
                    <CardDescription>{addon.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Cost:</span>
                        <span className="font-semibold">${addon.cost}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Usage this month:</span>
                          <span>{addon.usage}%</span>
                        </div>
                        <Progress value={addon.usage} className="h-2" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Add-on
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown - Current Month</CardTitle>
                <CardDescription>Detailed breakdown of your monthly costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBreakdown.map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${item.amount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg">${usageData.currentMonth.cost}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
                <CardDescription>Your usage trends over the past 4 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {usageHistory.map((month) => (
                    <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{month.month}</span>
                        </div>
                        <div>
                          <div className="font-medium">{month.calls.toLocaleString()} calls</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {month.messages.toLocaleString()} messages
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${month.cost}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total cost</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Billing Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Billing & Account</CardTitle>
            <CardDescription>Manage your billing and account settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <span className="font-semibold">View Invoice</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Download current month's invoice</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <span className="font-semibold">Update Payment</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Change payment method</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                <span className="font-semibold">Usage Alerts</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Set up usage notifications</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
