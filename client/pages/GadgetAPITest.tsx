import React, { useState } from 'react';
import { EventsDashboard } from '../components/EventsDashboard';
import { SimpleEventsExample } from '../components/SimpleEventsExample';
import { ServerEventsExample } from '../components/ServerEventsExample';

export default function GadgetAPITest() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'direct' | 'server'>('server');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Gadget API Test Suite</h1>
        <p className="text-muted-foreground">
          Testing different approaches to fetch events for shop: checkoutipick.myshopify.com (ID: 91283456333)
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('server')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'server'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🖥️ Server API
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'direct'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔗 Direct API
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Full Dashboard
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'server' && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Server API Approach</h3>
              <p className="text-blue-700 text-sm">
                This approach uses the existing server infrastructure. The server handles authentication 
                and forwards requests to the Gadget API. This is the recommended approach for production use.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <strong>Endpoint:</strong> /api/gadget/events?shopDomain=checkoutipick.myshopify.com
              </div>
            </div>
            <ServerEventsExample />
          </div>
        )}

        {activeTab === 'direct' && (
          <div>
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Direct API Approach</h3>
              <p className="text-green-700 text-sm">
                This approach directly calls the Gadget API from the client. Requires API key configuration 
                and proper CORS setup. Good for development and testing.
              </p>
              <div className="mt-2 text-xs text-green-600">
                <strong>Endpoint:</strong> https://itrcks--development.gadget.app/api/graphql
              </div>
            </div>
            <SimpleEventsExample />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Full Dashboard</h3>
              <p className="text-purple-700 text-sm">
                A comprehensive dashboard with real-time updates, filtering, and advanced analytics. 
                Uses the direct API approach with React hooks and auto-refresh.
              </p>
              <div className="mt-2 text-xs text-purple-600">
                <strong>Features:</strong> Real-time updates, filtering, pagination, statistics
              </div>
            </div>
            <EventsDashboard 
              shopId="91283456333"
              shopDomain="checkoutipick.myshopify.com"
            />
          </div>
        )}
      </div>

      {/* API Comparison */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">API Approach Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-blue-600 mb-2">🖥️ Server API</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Secure (API key on server)</li>
              <li>✅ No CORS issues</li>
              <li>✅ Production ready</li>
              <li>✅ Rate limiting handled</li>
              <li>❌ Requires server running</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-green-600 mb-2">🔗 Direct API</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Simple setup</li>
              <li>✅ No server dependency</li>
              <li>✅ Good for development</li>
              <li>❌ API key exposed to client</li>
              <li>❌ CORS configuration needed</li>
            </ul>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-purple-600 mb-2">📊 Full Dashboard</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Rich UI components</li>
              <li>✅ Real-time updates</li>
              <li>✅ Advanced filtering</li>
              <li>✅ Comprehensive analytics</li>
              <li>❌ More complex setup</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-semibold text-yellow-800 mb-4">Setup Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-yellow-700 mb-2">For Server API (Recommended):</h3>
            <ol className="text-sm text-yellow-700 space-y-1 ml-4">
              <li>1. Make sure the server is running: <code className="bg-yellow-100 px-1 rounded">npm run dev:server</code></li>
              <li>2. The server should have the Gadget API key configured</li>
              <li>3. Access the "Server API" tab above</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-700 mb-2">For Direct API:</h3>
            <ol className="text-sm text-yellow-700 space-y-1 ml-4">
              <li>1. Add <code className="bg-yellow-100 px-1 rounded">VITE_GADGET_API_KEY</code> to your .env file</li>
              <li>2. Get the API key from your Gadget app settings</li>
              <li>3. Access the "Direct API" tab above</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-700 mb-2">For Full Dashboard:</h3>
            <ol className="text-sm text-yellow-700 space-y-1 ml-4">
              <li>1. Configure the direct API setup first</li>
              <li>2. Access the "Full Dashboard" tab above</li>
              <li>3. Enjoy real-time analytics and filtering</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
