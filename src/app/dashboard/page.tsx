"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard-layout";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function DashboardPage() {
  const { user } = useUser();

  // Get real data from Convex
  const agents = useQuery(api.agents.getUserAgents, user?.id ? { userId: user.id } : "skip");
  const deployments = useQuery(api.deployments.getUserDeployments, user?.id ? { userId: user.id } : "skip");

  // Calculate stats from real data
  const stats = {
    agentCount: agents?.length || 0,
    activeAgents: agents?.filter(a => a.status === 'active').length || 0,
    totalDeployments: deployments?.length || 0,
    averageRating: "4.8", // This will come from analytics later
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user?.firstName || "User"}!
        </h1>
        <p className="text-gray-600">
          Here's a quick overview of your BevPro agents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Agents</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {stats.agentCount}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Active Agents</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {stats.activeAgents}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Deployments</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {stats.totalDeployments}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Average Rating</h3>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {stats.averageRating}
          </p>
        </div>
      </div>

      {/* Agents Overview */}
      <div className="gradient-border rounded-sm">
        <div className="bg-white p-8 rounded-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your Voice Agents</h2>
            <Link
              href="/dashboard/agent-designer"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Agent
            </Link>
          </div>

          {agents && agents.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <div key={agent._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{agent.name}</h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        agent.type === 'Bevpro'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {agent.type}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      agent.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : agent.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>Type: {agent.type}</p>
                    <p>Status: {agent.status}</p>
                    {agent.description && <p>Description: {agent.description}</p>}
                    <p>Created: {new Date(agent.lastModified).toLocaleDateString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/agent-designer?edit=${agent._id}`}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/deploy?agentId=${agent._id}`}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Deploy
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No agents yet</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first voice agent.</p>
              <Link
                href="/dashboard/agent-designer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Agent
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}