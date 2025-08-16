"use client";

import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { useState } from "react";

export default function DeployPage() {
  // Real agent data will come from Convex
  const agent = {
    name: "Bar Assistant",
    deploymentId: "agent_123",
    status: "deployed",
    environment: "production",
    createdAt: "2024-01-15",
  };
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://voxvenue.ai/embed.js" data-agent="${agent.deploymentId}"></script>`;
  const phoneNumber = "+1 (555) 123-4567"; // Placeholder

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading agent...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Deploy Agent</h1>
          <p className="text-gray-600">Choose how to deploy "{agent.name}"</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="gradient-border rounded-sm">
            <div className="bg-white p-6 rounded-sm space-y-4">
              <h2 className="text-xl font-bold">Website Embed</h2>
              <p className="text-sm text-gray-600">
                Add this script to your website's HTML to enable voice interactions
              </p>
              <div className="bg-gray-50 p-3 rounded-sm font-mono text-xs break-all">
                {embedCode}
              </div>
              <button
                onClick={() => handleCopy(embedCode)}
                className="w-full px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-900 transition-colors"
              >
                {copied ? "Copied!" : "Copy Embed Code"}
              </button>
            </div>
          </div>

          <div className="gradient-border rounded-sm">
            <div className="bg-white p-6 rounded-sm space-y-4">
              <h2 className="text-xl font-bold">Phone Number</h2>
              <p className="text-sm text-gray-600">
                Customers can call this number to interact with your agent
              </p>
              <div className="bg-gray-50 p-3 rounded-sm font-mono text-lg text-center">
                {phoneNumber}
              </div>
              <button
                disabled
                className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-sm cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        <div className="gradient-border rounded-sm">
          <div className="bg-white p-6 rounded-sm space-y-4">
            <h2 className="text-xl font-bold">Integration Instructions</h2>
            <ol className="space-y-2 text-sm">
              <li>1. Copy the embed code above</li>
              <li>2. Paste it just before the closing &lt;/body&gt; tag on your website</li>
              <li>3. The voice agent will appear as a floating button on your site</li>
              <li>4. Users can click the button or say "{agent.wakeWord}" to activate</li>
            </ol>
          </div>
        </div>

        <div className="gradient-border rounded-sm">
          <div className="bg-white p-6 rounded-sm">
            <h2 className="text-xl font-bold mb-4">Agent Details</h2>
            <dl className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-600">Deployment ID</dt>
                <dd className="font-mono">{agent.deploymentId}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Voice</dt>
                <dd className="capitalize">{agent.voice}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Wake Word</dt>
                <dd>{agent.wakeWord}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Status</dt>
                <dd className={agent.isActive ? "text-green-600" : "text-gray-600"}>
                  {agent.isActive ? "Active" : "Inactive"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}