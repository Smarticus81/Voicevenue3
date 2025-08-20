import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BevPro Studio - Professional Voice Agent Platform',
    short_name: 'BevPro Studio',
    description: 'Create and deploy professional voice agents for event venues and bars with ultra-low latency',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10a37f',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en-US',
    dir: 'ltr',
    categories: ['business', 'productivity', 'utilities'],
    iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
    prefer_related_applications: false,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: '/screenshots/dashboard-wide.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Dashboard View'
      },
      {
        src: '/screenshots/agent-builder-wide.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Agent Builder'
      },
      {
        src: '/screenshots/voice-interface-narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Voice Interface'
      }
    ],
    shortcuts: [
      {
        name: 'Create Agent',
        short_name: 'New Agent',
        description: 'Create a new voice agent',
        url: '/dashboard/agent-designer',
        icons: [
          {
            src: '/shortcuts/create-agent.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your agents and deployments',
        url: '/dashboard',
        icons: [
          {
            src: '/shortcuts/dashboard.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'Voice Demo',
        short_name: 'Voice',
        description: 'Test voice interaction',
        url: '/voice-demo',
        icons: [
          {
            src: '/shortcuts/voice.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      }
    ],
    related_applications: [],
    display_override: ['window-controls-overlay', 'standalone', 'browser'],
    edge_side_panel: {
      preferred_width: 400
    },
    launch_handler: {
      client_mode: ['navigate-existing', 'auto']
    },
    handle_links: 'preferred',
    file_handlers: [
      {
        action: '/dashboard/agent-designer',
        accept: {
          'application/json': ['.json'],
          'text/csv': ['.csv']
        }
      }
    ],
    protocol_handlers: [
      {
        protocol: 'web+bevpro',
        url: '/?agent=%s'
      }
    ],
    share_target: {
      action: '/share',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
        files: [
          {
            name: 'data',
            accept: ['application/json', 'text/csv']
          }
        ]
      }
    }
  };
}
