export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.HELIUS_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'HELIUS_API_KEY is not configured' })
  }

  try {
    const response = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      }
    )

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (error) {
    return res.status(500).json({
      error: 'Solana RPC request failed',
    })
  }
}