import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const url =
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polygon,polkadot,avalanche-2&vs_currencies=usd&include_24hr_change=true'

    const res = await fetch(url, { next: { revalidate: 60 } })
    const data = await res.json()

    // 👇 Return raw data if API responds with unexpected shape
    if (!data.bitcoin) {
      return NextResponse.json(
        { error: 'Unexpected CoinGecko response', raw: data },
        { status: 500 }
      )
    }

    const mapping = {
      bitcoin: 'BTC',
      ethereum: 'ETH',
      binancecoin: 'BNB',
      solana: 'SOL',
      ripple: 'XRP',
      cardano: 'ADA',
      dogecoin: 'DOGE',
      polygon: 'MATIC',
      polkadot: 'DOT',
      'avalanche-2': 'AVAX'
    }

    const formatted = []

    for (const key in mapping) {
      if (data[key]) {
        formatted.push({
          name: mapping[key],
          price: `$${data[key].usd.toFixed(2)}`,
          change: `${data[key].usd_24h_change.toFixed(2)}%`,
          positive: data[key].usd_24h_change >= 0
        })
      }
    }

    return NextResponse.json(formatted)

  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
