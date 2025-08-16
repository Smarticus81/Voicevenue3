"use client";

import { useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user } = useUser();
  const { organization, createOrganization } = useOrganization();
  const router = useRouter();
  const [step, setStep] = useState(organization ? 2 : 1);
  const [loading, setLoading] = useState(false);

  const createOrg = useMutation(api.orgs.create);
  const connectSquare = useMutation(api.orgs.connectSquare);

  const handleCreateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const org = await createOrganization({
        name: formData.get("name") as string,
      });

      await createOrg({
        clerkOrgId: org.id,
        name: org.name,
        type: formData.get("type") as "bar" | "venue" | "restaurant",
        clerkUserId: user.id,
      });

      setStep(2);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSquareOAuth = async () => {
    if (!organization || !user) return;

    setLoading(true);
    
    // In production, this would redirect to Square OAuth
    // For now, we'll simulate with test credentials
    const testMerchantId = "TEST_MERCHANT_" + Date.now();
    const testAccessToken = "TEST_TOKEN_" + Math.random().toString(36);

    try {
      const org = await createOrg({
        clerkOrgId: organization.id,
        name: organization.name,
        type: "bar",
        clerkUserId: user.id,
      });

      await connectSquare({
        orgId: org,
        merchantId: testMerchantId,
        accessToken: testAccessToken,
        clerkUserId: user.id,
      });

      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="gradient-bg text-white px-4 py-2 rounded-sm inline-block">
          <h1 className="text-xl font-bold">VoxVenue</h1>
        </div>

        {step === 1 ? (
          <div className="gradient-border rounded-sm">
            <div className="bg-white p-8 rounded-sm">
              <h2 className="text-2xl font-bold mb-6">Create Your Organization</h2>
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Organization Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                    placeholder="The Blue Note"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                  >
                    <option value="bar">Bar</option>
                    <option value="venue">Venue</option>
                    <option value="restaurant">Restaurant</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Continue"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="gradient-border rounded-sm">
            <div className="bg-white p-8 rounded-sm">
              <h2 className="text-2xl font-bold mb-6">Connect Square</h2>
              <p className="text-gray-600 mb-6">
                Connect your Square account to enable inventory management, order processing, and payments.
              </p>
              <div className="space-y-4">
                <button
                  onClick={handleSquareOAuth}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {loading ? "Connecting..." : "Connect with Square"}
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors"
                >
                  Skip for now
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                By connecting, you agree to share your Square data with VoxVenue for voice agent operations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
