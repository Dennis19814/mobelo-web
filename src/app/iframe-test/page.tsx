'use client'

import { useState, useEffect, useRef } from 'react'

export default function IframeTestPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const [loadTime, setLoadTime] = useState<number | null>(null)
  const [iframeKey, setIframeKey] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  const loadStartTime = useRef<number>(0)
  const iframeUrl = 'https://app-573.mobelo.dev/'

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev])
    console.log(`[IframeTest] ${message}`)
  }

  useEffect(() => {
    addLog(`🔄 Iframe mounting with key: ${iframeKey}`)
    setIframeLoaded(false)
    setIframeError(false)
    setLoadTime(null)
    loadStartTime.current = Date.now()
  }, [iframeKey])

  const handleIframeLoad = () => {
    const duration = Date.now() - loadStartTime.current
    setLoadTime(duration)
    setIframeLoaded(true)
    setIframeError(false)
    addLog(`✅ Iframe loaded successfully in ${duration}ms`)
  }

  const handleIframeError = () => {
    const duration = Date.now() - loadStartTime.current
    setIframeError(true)
    setIframeLoaded(false)
    addLog(`❌ Iframe failed to load after ${duration}ms`)
  }

  const handleReload = () => {
    addLog('🔄 Manual reload triggered')
    setIframeKey(prev => prev + 1)
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Iframe Loading Test Page</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Status Cards */}
            <div className="bg-orange-50 p-4 rounded border border-orange-200">
              <h3 className="font-semibold text-slate-900 mb-2">Iframe URL</h3>
              <p className="text-sm text-orange-700 break-all">{iframeUrl}</p>
            </div>

            <div className={`p-4 rounded border ${
              iframeLoaded ? 'bg-green-50 border-green-200' :
              iframeError ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2">Load Status</h3>
              <p className="text-sm">
                {iframeLoaded ? '✅ Loaded' : iframeError ? '❌ Error' : '⏳ Loading...'}
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">Load Time</h3>
              <p className="text-sm text-purple-700">
                {loadTime !== null ? `${loadTime}ms` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleReload}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
            >
              🔄 Reload Iframe
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              🗑️ Clear Logs
            </button>
          </div>

          {/* Logs */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Debug Logs ({logs.length})</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs h-48 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Iframe Container */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Live Preview (Iframe Key: {iframeKey})</h2>

          <div className="relative bg-gray-100 rounded" style={{ height: '800px' }}>
            {!iframeLoaded && !iframeError && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading iframe...</p>
                </div>
              </div>
            )}

            {iframeError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                <div className="text-center">
                  <p className="text-red-600 text-lg mb-4">❌ Failed to load iframe</p>
                  <button
                    onClick={handleReload}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <iframe
              key={`iframe-${iframeKey}`}
              src={iframeUrl}
              className="w-full h-full border-2 border-gray-300 rounded"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="accelerometer; camera; microphone; geolocation"
              title="App Preview Test"
            />
          </div>
        </div>

        {/* Technical Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="font-semibold mb-4">Technical Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">Iframe Attributes:</p>
              <ul className="list-disc list-inside text-gray-600 mt-2">
                <li>allow: accelerometer, camera, microphone, geolocation</li>
                <li>No sandbox restrictions</li>
                <li>No referrerPolicy set (default)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Expected Headers:</p>
              <ul className="list-disc list-inside text-gray-600 mt-2">
                <li>X-Frame-Options: Not set (allows iframe)</li>
                <li>Access-Control-Allow-Origin: http://mobelo.dev</li>
                <li>CORS should be enabled</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
