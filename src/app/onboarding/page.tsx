"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VenueOnboarding } from '@/components/venue-onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = (venueInfo: any) => {
    setIsComplete(true);
    // Redirect to dashboard after a brief delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to BevPro Studio!</h1>
          <p className="text-slate-600 dark:text-slate-400">Redirecting you to your dashboard...</p>
          <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <VenueOnboarding onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  );
}
