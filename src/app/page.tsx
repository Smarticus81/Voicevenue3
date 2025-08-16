import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const { userId } = auth();
  
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <header className="flex justify-between items-center mb-16">
          <div className="flex items-center">
            <Image 
              src="/bevpro-logo.svg" 
              alt="BevPro" 
              width={140} 
              height={24}
              className="h-6 w-auto"
            />
          </div>
          <div className="flex gap-4">
            <Link 
              href="/sign-in" 
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 hover:shadow-md"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </header>

        <main className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl font-bold leading-tight text-blue-900">
              Ultra-Low Latency
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Voice AI for Bars
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Deploy conversational AI agents with &lt;120ms response times. 
              Multi-turn conversations, tool calling, and Square POS integration.
            </p>
            <div className="flex gap-4">
              <Link 
                href="/sign-up" 
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/onboarding" 
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white hover:shadow-md transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-8 border-t">
              <div>
                <div className="text-2xl font-bold text-blue-900">&lt;120ms</div>
                <div className="text-sm text-gray-600">Response time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">GPT-4o</div>
                <div className="text-sm text-gray-600">Realtime API</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-900">Square</div>
                <div className="text-sm text-gray-600">POS Ready</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Real-time Voice Processing</span>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">"What's on tap?"</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg ml-8">
                  <p className="text-sm text-blue-700">"We have 12 beers on tap including Stone IPA, Lagunitas, and our house Hazy IPA..."</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">"Add 2 Stone IPAs to tab 5"</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg ml-8">
                  <p className="text-sm text-blue-700">"Added 2 Stone IPAs to tab 5. Total is now $47.50"</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <section id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2 text-blue-900">OpenAI Realtime</h3>
            <p className="text-gray-600">
              Native GPT-4o integration with ultra-low latency streaming. Multi-turn conversations with context retention.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2 text-blue-900">Tool Calling</h3>
            <p className="text-gray-600">
              Execute POS operations, check inventory, process orders, and handle payments through voice commands.
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2 text-blue-900">Enterprise Ready</h3>
            <p className="text-gray-600">
              Deploy on-premise or cloud. HIPAA compliant infrastructure with end-to-end encryption.
            </p>
          </div>
        </section>

        <footer className="mt-32 pt-16 border-t border-gray-200">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2">
              <Image 
                src="/bevpro-logo.svg" 
                alt="BevPro" 
                width={100} 
                height={17}
                className="h-4 w-auto mb-4"
              />
              <p className="text-sm text-gray-600 max-w-sm">
                Ultra-low latency voice AI platform designed specifically for bars and beverage service operations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-900">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link></li>
                <li><Link href="/onboarding" className="hover:text-gray-900">Onboarding</Link></li>
                <li><Link href="#features" className="hover:text-gray-900">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-blue-900">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="#" className="hover:text-gray-900">About</Link></li>
                <li><Link href="#" className="hover:text-gray-900">Contact</Link></li>
                <li><Link href="#" className="hover:text-gray-900">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex justify-between items-center text-sm text-gray-600">
            <p>&copy; 2024 BevPro Studio. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-gray-900">Privacy</Link>
              <Link href="#" className="hover:text-gray-900">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}