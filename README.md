# 📈 Interactive Trading Chart with Trendlines

A real-time trading chart application built with Next.js and TradingView's Lightweight Charts library. Draw, edit, and manage trendlines on live BTC/USDT data from Binance.

## 🌐 Live Demo

**Try it now:** [https://trading-trendlines.vercel.app](https://trading-trendlines.vercel.app)

## ⚡ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/devansh0703/trading-trendlines.git
cd trading-trendlines
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Deploy to Vercel
```bash
# Push to GitHub first
git add .
git commit -m "Initial commit"
git push origin main

# Deploy to Vercel
npm i -g vercel
vercel --prod
```

**Vercel Build Settings:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## 🚀 Features

- **Real-time Data**: Live BTC/USDT price feed from Binance WebSocket
- **Interactive Trendlines**: Click to draw, drag endpoints to adjust
- **Persistent Storage**: Trendlines saved in localStorage
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Professional trading interface

## 🎯 How to Use

1. **Draw Trendlines**: Click "Draw Trendline" → Click two points on chart
2. **Edit Trendlines**: Use "Drag Start/End" buttons to reposition endpoints
3. **Delete Trendlines**: Click "Delete" on individual trendlines or "Clear All"
4. **Auto-Save**: All trendlines persist between browser sessions

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Charts**: TradingView Lightweight Charts
- **Styling**: CSS-in-JS with dark theme
- **Data Source**: Binance API & WebSocket
- **Deployment**: Vercel ([Live Demo](https://trading-trendlines.vercel.app))

## 📁 Project Structure

```
├── components/
│   └── TradingChart.tsx      # Main chart component
├── pages/
│   ├── index.tsx            # Home page
│   └── _app.tsx             # App wrapper
├── styles/                  # CSS files
├── public/                  # Static assets
└── package.json            # Dependencies
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables
- `NEXT_TELEMETRY_DISABLED=1` - Disable Next.js telemetry

## 🌐 API Integration

### Binance WebSocket
- **Endpoint**: `wss://stream.binance.com:9443/ws/btcusdt@kline_1m`
- **Data**: Real-time 1-minute candlestick updates
- **Fallback**: Mock data generation if connection fails

### Binance REST API
- **Endpoint**: `https://api.binance.com/api/v3/klines`
- **Parameters**: `symbol=BTCUSDT&interval=1d&limit=365`
- **Purpose**: Historical data for chart initialization

## 🎨 Features Deep Dive

### Trendline System
- **Drawing Mode**: Click-based point selection
- **Visual Feedback**: Orange highlighting for active trendlines
- **Drag & Drop**: Intuitive endpoint manipulation
- **Persistence**: LocalStorage integration

### Chart Capabilities
- **Real-time Updates**: Live price feed integration
- **Responsive Design**: Auto-resize on window changes
- **Professional UI**: Dark theme with trading-focused aesthetics
- **Performance**: Optimized rendering with minimal re-renders

## 🚦 Deployment Notes

### Vercel (Recommended)
- Zero-config deployment
- Automatic builds on git push
- Global CDN distribution
- Custom domain support

### Build Requirements
- Node.js 18+
- TypeScript support
- ESLint configuration

## 🐛 Troubleshooting

### Common Issues
1. **WebSocket Connection**: Check network/firewall settings
2. **Build Errors**: Ensure all dependencies are installed
3. **Performance**: Clear browser cache if chart feels slow

### Development Tips
- Use browser dev tools to monitor WebSocket connection
- Check console for API rate limiting messages
- LocalStorage persists between sessions - use "Clear All" to reset

## 📄 License

MIT License - Feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

---

Built with ❤️ using Next.js and TradingView Lightweight Charts
