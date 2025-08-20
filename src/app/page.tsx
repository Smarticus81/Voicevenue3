import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mic, Phone, Calendar, CreditCard } from "lucide-react";
import "./homepage.css";

export default async function HomePage() {
  const { userId } = auth();
  
  // Remove automatic redirect - let users access landing page even when authenticated
  // if (userId) {
  //   redirect("/dashboard");
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                BevPro Studio
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {userId ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/dashboard/agent-designer" 
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Create Agent
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/sign-in" 
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/sign-up" 
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-slate-900 dark:text-white">
                Where Your Event Venue
                <span className="block bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                  Finds Its Voice
                </span>
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                Your event venue's personal AI assistant that handles calls, books events, manages your calendar, 
                and provides instant customer support. <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Save time and money</span> while never missing a booking opportunity.
              </p>
            </div>
            
            <div className="flex gap-4">
              {userId ? (
                <>
                  <Link 
                    href="/dashboard/agent-designer" 
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Create Your Agent
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="px-8 py-4 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-lg transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    href="/sign-up" 
                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    Start Free Trial
                  </Link>
                  <Link 
                    href="/onboarding" 
                    className="px-8 py-4 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-lg transition-colors"
                  >
                    Learn More
                  </Link>
                </>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">40%</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Cost savings</div>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">24/7</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Availability</div>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">$0</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Setup fee</div>
              </div>
            </div>
          </div>

          {/* Right Column - Video */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60 animate-slide-in-right">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">See BevPro Studio in Action</span>
              </div>
              
              {/* Video Container */}
              <div className="relative group">
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl">
                  <video
                    className="w-full h-auto max-h-[400px] object-cover transition-opacity duration-500"
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ aspectRatio: '16/9' }}
                  >
                    <source src="/bpvideo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Overlay with play button */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"></div>
                </div>
                
                {/* Video caption */}
                <div className="mt-4 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Experience seamless voice AI for your venue
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-32">
          <div className="text-center mb-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Everything Your Venue Needs
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              From answering calls to processing payments, our AI assistant handles it all with professional precision.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60 group hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Answer Calls</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Never miss an event booking. Your AI assistant answers calls 24/7, handles inquiries, and books events automatically.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60 group hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Manage Calendar</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatically sync with your existing calendar, check venue availability, and schedule events without manual intervention.
              </p>
            </div>

            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-8 border border-slate-200/60 dark:border-slate-700/60 group hover:shadow-lg transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Process Payments</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Accept event deposits and payments over the phone. Integrates with your existing payment systems for seamless transactions.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  BevPro Studio
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
                Professional AI voice agents for event venues and event venue bars.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Product</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="/dashboard" className="hover:text-slate-900 dark:hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/onboarding" className="hover:text-slate-900 dark:hover:text-white transition-colors">Onboarding</Link></li>
                <li><Link href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Company</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
            <p>&copy; 2024 BevPro Studio. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}