'use client'

import { useState, useEffect } from 'react'

export const dynamic = 'force-dynamic'

export default function DebugPage() {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch('/api/debug/env')
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => setError(err.message))
    }, [])

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Environment Debugger</h1>

            {error && (
                <div className="bg-red-100 p-4 rounded text-red-700 mb-4">
                    Error: {error}
                </div>
            )}

            {data ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                    {JSON.stringify(data, null, 2)}
                </pre>
            ) : (
                <div>Loading...</div>
            )}

            <div className="mt-8 text-gray-500">
                <p>Expected Key Prefix: eyJhbG...</p>
                <p>Your Key Prefix: {data?.keyPrefix || '...'}</p>
            </div>
        </div>
    )
}
