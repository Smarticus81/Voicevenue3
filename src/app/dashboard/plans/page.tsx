"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for small venues just getting started',
    features: [
      '1 AI Assistant',
      '500 voice calls per month',
      '1,000 text messages per month',
      'Basic calendar integration',
      'Email support',
      'Standard voice quality'
    ],
    popular: false,
    savings: 'Save $120/year'
  },
  {
    name: 'Professional',
    price: 99,
    description: 'Ideal for growing venues with multiple events',
    features: [
      '3 AI Assistants',
      '2,000 voice calls per month',
      '5,000 text messages per month',
      'Advanced calendar integration',
      'Payment processing',
      'Priority support',
      'Multi-language support',
      'Custom branding'
    ],
    popular: true,
    savings: 'Save $240/year'
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For large venues and event management companies',
    features: [
      'Unlimited AI Assistants',
      '10,000 voice calls per month',
      '25,000 text messages per month',
      'Full CRM integration',
      'Advanced analytics',
      'Dedicated support',
      'Custom integrations',
      'White-label options',
      'API access',
      'Advanced security'
    ],
    popular: false,
    savings: 'Save $480/year'
  }
];

const addons = [
  {
    name: 'Advanced Voice Processing',
    price: 29.99,
    description: 'Enhanced voice recognition and natural language processing',
    features: ['Better accuracy', 'Multiple accents', 'Noise reduction']
  },
  {
    name: 'Multi-Language Support',
    price: 19.99,
    description: 'Support for Spanish, French, German, and more',
    features: ['5 languages included', 'Cultural adaptation', 'Localized responses']
  },
  {
    name: 'Calendar Integration',
    price: 14.99,
    description: 'Seamless integration with Google Calendar and Outlook',
    features: ['Auto-scheduling', 'Conflict detection', 'Reminder system']
  },
  {
    name: 'Payment Processing',
    price: 24.99,
    description: 'Accept payments directly through your AI assistant',
    features: ['Stripe integration', 'Square integration', 'Secure payments']
  },
  {
    name: 'Advanced Analytics',
    price: 39.99,
    description: 'Detailed insights into your venue performance',
    features: ['Call analytics', 'Booking trends', 'Revenue tracking']
  },
  {
    name: 'Custom Integrations',
    price: 99.99,
    description: 'Connect with your existing software and tools',
    features: ['API development', 'Custom workflows', 'Data sync']
  }
];

export default function PlansPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
            Select the perfect plan for your venue. All plans include our core AI assistant features 
            with different levels of usage and additional capabilities.
          </p>
        </div>

        {/* Main Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {plan.savings}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.popular ? 'Get Started' : 'Choose Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add-ons & Extensions</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Enhance your AI assistant with additional capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addons.map((addon) => (
              <Card key={addon.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  <CardDescription>{addon.description}</CardDescription>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${addon.price}
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-normal">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {addon.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full">
                    Add to Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Why Choose Bevpro Studio?</CardTitle>
            <CardDescription>
              See how our AI assistants can transform your venue operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="font-semibold mb-2">Save Money</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reduce staffing costs by up to 40% while improving customer service
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">⏰</div>
                <h3 className="font-semibold mb-2">Save Time</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automate repetitive tasks and focus on what matters most
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="font-semibold mb-2">Increase Revenue</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Never miss a booking opportunity with 24/7 availability
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Can I change my plan anytime?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What happens if I exceed my monthly limits?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We'll notify you when you're approaching your limits. You can upgrade your plan or purchase additional usage.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Is there a setup fee?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No setup fees. You only pay for your chosen plan and any add-ons you select.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes, you can cancel your subscription at any time. No long-term contracts required.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Need a Custom Solution?</CardTitle>
            <CardDescription>
              Contact us for enterprise pricing and custom integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">
                Contact Sales
              </Button>
              <Button>
                Schedule Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
