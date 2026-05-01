import express, { type Request, type Response } from 'express'
import axios from 'axios'
import cors from 'cors'

const app = express()
app.use(cors())

// Define strict interfaces for API responses
interface GeoResponse {
  currency: string
  country_name: string
  ip: string
}

interface ExchangeRateResponse {
  conversion_rates: {
    [key: string]: number
  }
}

app.get('/api/config', async (req: Request, res: Response) => {
  try {
    // 1. Get the User's IP (Important: If you call from the server,
    // the API sees the Server IP. We must pass the client IP.)
    const forwarded = req.headers['x-forwarded-for']
    const userIp =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0]
        : req.socket.remoteAddress

    // 2. Get User Location & Currency
    const geoRes = await axios.get<GeoResponse>(
      `https://ipapi.co/${userIp}/json/`,
    )
    console.log(geoRes)
    const userCurrency = geoRes.data.currency || 'USD'

    // 3. Get Exchange Rates
    const API_KEY = 'f4001d6cac59b7b6b681cb26'
    const rateRes = await axios.get<ExchangeRateResponse>(
      `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`,
    )

    const conversionRate = rateRes.data.conversion_rates[userCurrency] || 1

    res.json({
      currency: userCurrency,
      rate: conversionRate,
    })
  } catch (err) {
    console.error('Currency Fetch Error:', err)
    res.status(500).json({
      error: 'Failed to fetch currency data',
      fallback: { currency: 'USD', rate: 1 },
    })
  }
})

app.listen(5000, () => console.log('TS Server running on port 5000'))
