'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Loader2, Eye, Code, Download, RefreshCw } from 'lucide-react';
import { AgentUIConfig, GeneratedUI } from '../lib/v0-client';

interface UIGenerationStepProps {
  agentName: string;
  agentType: 'Bevpro' | 'Venue Voice';
  description: string;
  voiceConfig: any;
  onUIGenerated: (ui: GeneratedUI) => void;
  onNext: () => void;
  onBack: () => void;
}

export function UIGenerationStep({
  agentName,
  agentType,
  description,
  voiceConfig,
  onUIGenerated,
  onNext,
  onBack,
}: UIGenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUI, setGeneratedUI] = useState<GeneratedUI | null>(null);
  const [uiCustomization, setUICustomization] = useState({
    colors: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
    },
    logo: '',
    typography: 'Inter',
    layout: 'dashboard',
  });
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const generateUI = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const agentConfig: AgentUIConfig = {
        name: agentName,
        type: agentType,
        description,
        voice: voiceConfig.voice,
        enabledTools: getEnabledTools(agentType),
        branding: uiCustomization,
      };

      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to generate UI');
      }

      const result = await response.json();
      const newGeneratedUI = result.data;
      
      setGeneratedUI(newGeneratedUI);
      onUIGenerated(newGeneratedUI);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate UI');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateUI = async () => {
    if (!feedback.trim()) {
      setError('Please provide feedback before regenerating');
      return;
    }
    await generateUI();
  };

  const getEnabledTools = (type: 'Bevpro' | 'Venue Voice') => {
    const tools = {
      'Bevpro': ['drink_orders', 'inventory', 'customers', 'payments', 'analytics'],
      'Venue Voice': ['events', 'venues', 'vendors', 'equipment', 'reports']
    };
    return tools[type] || [];
  };

  const handleNext = () => {
    if (generatedUI) {
      onNext();
    } else {
      setError('Please generate UI before proceeding');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Step 4: Generate Agent UI</h2>
        <p className="text-gray-600 mt-2">
          Create a beautiful, mobile-optimized interface for your voice agent
        </p>
      </div>

      {/* UI Customization */}
      <Card>
        <CardHeader>
          <CardTitle>UI Customization</CardTitle>
          <CardDescription>
            Customize the look and feel of your agent's interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary-color">Primary Color</Label>
              <Input
                id="primary-color"
                type="color"
                value={uiCustomization.colors.primary}
                onChange={(e) => setUICustomization(prev => ({
                  ...prev,
                  colors: { ...prev.colors, primary: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <Input
                id="secondary-color"
                type="color"
                value={uiCustomization.colors.secondary}
                onChange={(e) => setUICustomization(prev => ({
                  ...prev,
                  colors: { ...prev.colors, secondary: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="logo-url">Logo URL (optional)</Label>
            <Input
              id="logo-url"
              placeholder="https://example.com/logo.png"
              value={uiCustomization.logo}
              onChange={(e) => setUICustomization(prev => ({
                ...prev,
                logo: e.target.value
              }))}
            />
          </div>

          <div>
            <Label htmlFor="layout">Layout Style</Label>
            <Select
              value={uiCustomization.layout}
              onValueChange={(value) => setUICustomization(prev => ({
                ...prev,
                layout: value
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="card-based">Card-based</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Generate UI Button */}
      <div className="text-center">
        <Button
          onClick={generateUI}
          disabled={isGenerating}
          size="lg"
          className="px-8"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating UI...
            </>
          ) : (
            <>
              <Code className="mr-2 h-4 w-4" />
              Generate Agent UI
            </>
          )}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Generated UI Preview */}
      {generatedUI && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated UI
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(generatedUI.previewUrl, '_blank')}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(generatedUI.code)}
                >
                  <Code className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Your agent's custom interface is ready! Preview it and make any adjustments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* UI Preview */}
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="text-center text-gray-500 mb-2">UI Preview</div>
              <iframe
                srcDoc={generatedUI.code}
                className="w-full h-64 border-0 bg-white rounded"
                title="Agent UI Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Feedback and Regeneration */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="feedback">Feedback for UI improvements</Label>
                <Textarea
                  id="feedback"
                  placeholder="Describe any changes you'd like to see..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button
                onClick={regenerateUI}
                variant="outline"
                disabled={!feedback.trim()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate with Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!generatedUI}>
          Next: Deploy Agent
        </Button>
      </div>
    </div>
  );
}
