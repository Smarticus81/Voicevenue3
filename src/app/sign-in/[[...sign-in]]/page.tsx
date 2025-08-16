import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block mb-8">
            <Image 
              src="/bevpro-logo.svg" 
              alt="BevPro" 
              width={140} 
              height={24}
              className="h-6 w-auto mx-auto"
            />
          </Link>
          <h2 className="text-3xl font-bold logo-primary">Welcome back</h2>
          <p className="mt-2 text-gray-600">Sign in to your BevPro Studio account</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none border border-gray-200 rounded-xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200",
              formButtonPrimary: "bg-[#10a37f] hover:bg-[#0d8a6f] rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
              footerActionLink: "text-[#10a37f] hover:text-[#0d8a6f]",
              identityPreviewEditButtonIcon: "text-[#10a37f]",
              formFieldInput: "rounded-lg border-gray-200 focus:border-[#10a37f] focus:ring-[#10a37f] transition-all duration-200",
              formFieldLabel: "text-gray-700",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500",
            },
          }}
        />
      </div>
    </div>
  );
}