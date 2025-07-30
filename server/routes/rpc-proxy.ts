import { Router } from 'express';

const router = Router();

// RPC Proxy endpoint to avoid CORS and rate limiting issues
router.post('/rpc-proxy', async (req, res) => {
  try {
    const heliusKey = process.env.HELIUS_API_KEY;
    
    // Priority order for RPC endpoints
    const endpoints = [
      heliusKey ? `https://rpc.helius.xyz/?api-key=${heliusKey}` : null,
      'https://api.mainnet-beta.solana.com',
      'https://ssc-dao.genesysgo.net/',
      'https://rpc.ankr.com/solana',
    ].filter(Boolean);

    let lastError;
    
    // Try each endpoint until one works
    for (const endpoint of endpoints) {
      if (!endpoint) continue;
      
      try {
        console.log(`Trying RPC endpoint: ${endpoint.includes('api-key') ? 'https://rpc.helius.xyz/?api-key=***' : endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`RPC request successful via ${endpoint.includes('api-key') ? 'Helius' : endpoint}`);
          return res.json(data);
        } else {
          const errorText = await response.text();
          lastError = `HTTP ${response.status}: ${errorText}`;
          console.log(`RPC endpoint failed: ${lastError}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.log(`RPC endpoint ${endpoint} failed: ${lastError}`);
        continue;
      }
    }

    // All endpoints failed
    console.error('All RPC endpoints failed:', lastError);
    res.status(503).json({
      error: 'RPC_UNAVAILABLE',
      message: 'All Solana RPC endpoints are currently unavailable',
      lastError
    });

  } catch (error) {
    console.error('RPC proxy error:', error);
    res.status(500).json({
      error: 'PROXY_ERROR',
      message: 'Internal server error in RPC proxy'
    });
  }
});

// Health check endpoint for RPC services
router.get('/rpc-health', async (req, res) => {
  const heliusKey = process.env.HELIUS_API_KEY;
  
  const endpoints = [
    { name: 'Helius', url: heliusKey ? `https://rpc.helius.xyz/?api-key=${heliusKey}` : null },
    { name: 'Mainnet Beta', url: 'https://api.mainnet-beta.solana.com' },
    { name: 'GenesysGo', url: 'https://ssc-dao.genesysgo.net/' },
    { name: 'Ankr', url: 'https://rpc.ankr.com/solana' },
  ].filter(endpoint => endpoint.url);

  const healthResults = [];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint.url!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth'
        })
      });
      
      const latency = Date.now() - startTime;
      const isHealthy = response.ok;
      
      healthResults.push({
        name: endpoint.name,
        healthy: isHealthy,
        latency: `${latency}ms`,
        status: response.status
      });
    } catch (error) {
      healthResults.push({
        name: endpoint.name,
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  res.json({
    timestamp: new Date().toISOString(),
    endpoints: healthResults,
    recommendation: healthResults.find(e => e.healthy)?.name || 'None available'
  });
});

export default router;