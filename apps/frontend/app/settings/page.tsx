"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Building2, Mic, Volume2 } from 'lucide-react';

export default function SettingsPage() {
  const [venueId, setVenueId] = useState('demo-venue');
  const [venueName, setVenueName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadSettings();
  }, [venueId]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/venue/settings?venueId=${venueId}`);
      const data = await response.json();
      setSettings(data);
      setVenueName(data.venueName || '');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/venue/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          venueId,
          venueName,
          ...settings
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('Settings saved successfully!');
        await loadSettings(); // Reload to get updated data
      } else {
        setMessage('Failed to save settings: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setMessage('Failed to save settings: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="neumorphic-card p-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow-lg">
              <Settings size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Bar Configuration</h1>
              <p className="text-gray-500">Set up your Bar's branding and voice agent settings</p>
            </div>
          </div>

          {/* Explanation Card */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">What is this page?</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p><strong>This is where you customize your voice-powered POS system.</strong></p>
              <p>• Set your Bar name that appears on all screens</p>
              <p>• Configure how your voice agent sounds and responds</p>
              <p>• Adjust voice recognition sensitivity for your environment</p>
              <p>• Changes here affect your kiosk, POS terminals, and staff interfaces</p>
            </div>
          </div>

          {/* Bar Branding Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Bar Branding</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bar Name
              </label>
              <div className="flex items-center space-x-3">
                <Building2 size={20} className="text-gray-500" />
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., The Blue Moon Grill"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                This appears on your POS screens, receipts, and customer-facing displays
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location ID
              </label>
              <input
                type="text"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., bluemoon-downtown"
              />
              <p className="text-sm text-gray-500 mt-1">
                Technical identifier for this location (used in URLs and system connections)
              </p>
            </div>
          </div>

          {/* Voice Agent Configuration */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Voice Agent Configuration</h2>
            <p className="text-sm text-gray-600 mb-4">These settings control how your AI bartender "Bev" sounds and behaves</p>
          </div>

          {/* Current Voice Settings Display */}
          {settings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="japanese-card p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Mic size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Voice & Speech</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Speech Recognition:</strong> {settings.asrProvider}</div>
                  <div><strong>Voice Provider:</strong> {settings.ttsProvider}</div>
                  <div><strong>Voice Style:</strong> {settings.realtimeVoice}</div>
                </div>
              </div>
              <div className="japanese-card p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Volume2 size={16} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Listening Sensitivity</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><strong>Noise Threshold:</strong> {settings.vadMinDb}dB</div>
                  <div><strong>Wake Phrase:</strong> "{settings.customWakeWord}"</div>
                  <div><strong>Server Region:</strong> {settings.region}</div>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <motion.button
              onClick={saveSettings}
              disabled={isLoading}
              className="japanese-button-primary px-8 py-3 flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save size={18} />
              <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
            </motion.button>
          </div>

          {/* Advanced Settings Note */}
          <div className="mt-8 p-6 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="text-lg font-semibold text-amber-800 mb-3">Need Advanced Settings?</h3>
            <div className="space-y-2 text-sm text-amber-700">
              <p>For voice recognition tuning, custom wake words, or multi-location setup, contact our support team.</p>
              <p>Most Bars work perfectly with the default voice settings shown above.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
