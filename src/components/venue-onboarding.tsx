"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Building, Calendar, Users, ArrowRight, SkipForward } from 'lucide-react';

interface VenueOnboardingProps {
  onComplete: (venueInfo: any) => void;
  onSkip: () => void;
}

export function VenueOnboarding({ onComplete, onSkip }: VenueOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [venueInfo, setVenueInfo] = useState({
    name: '',
    type: '',
    capacity: '',
    services: [] as string[],
    contactEmail: '',
    contactPhone: ''
  });

  const steps = [
    {
      id: 1,
      title: 'Venue Information',
      description: 'Tell us about your venue',
      icon: Building
    },
    {
      id: 2,
      title: 'Services & Capacity',
      description: 'What services do you offer?',
      icon: Users
    },
    {
      id: 3,
      title: 'Contact Details',
      description: 'How can we reach you?',
      icon: Calendar
    }
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(venueInfo);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateVenueInfo = (field: string, value: any) => {
    setVenueInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              BevPro Studio
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to BevPro Studio
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Let's set up your venue for success with AI-powered voice assistance
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-slate-400'
              }`}>
                {currentStep > step.id ? (
                  <span className="text-sm">✓</span>
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700"
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Venue Information
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Tell us about your venue so we can customize your AI assistant
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueInfo.name}
                  onChange={(e) => updateVenueInfo('name', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="e.g., Grand Plaza Events"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Venue Type
                </label>
                <select
                  value={venueInfo.type}
                  onChange={(e) => updateVenueInfo('type', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">Select venue type</option>
                  <option value="event-hall">Event Hall</option>
                  <option value="conference-center">Conference Center</option>
                  <option value="wedding-venue">Wedding Venue</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="bar">Bar</option>
                  <option value="hotel">Hotel</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Services & Capacity
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  What services do you offer and what's your capacity?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Maximum Capacity
                </label>
                <input
                  type="number"
                  value={venueInfo.capacity}
                  onChange={(e) => updateVenueInfo('capacity', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="e.g., 200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Services Offered
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Catering',
                    'Audio/Visual',
                    'Parking',
                    'Bar Service',
                    'Event Planning',
                    'Photography',
                    'Security',
                    'WiFi'
                  ].map((service) => (
                    <label key={service} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={venueInfo.services.includes(service)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateVenueInfo('services', [...venueInfo.services, service]);
                          } else {
                            updateVenueInfo('services', venueInfo.services.filter(s => s !== service));
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Contact Details
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  How can we reach you for important updates?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={venueInfo.contactEmail}
                  onChange={(e) => updateVenueInfo('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="contact@venue.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={venueInfo.contactPhone}
                  onChange={(e) => updateVenueInfo('contactPhone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onSkip}
              className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              <span>Skip for now</span>
            </button>

            <div className="flex space-x-3">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                <span>{currentStep === 3 ? 'Complete Setup' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 