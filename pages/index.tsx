
import type { NextPage } from "next";
import Head from "next/head";
import TradingChart from "../components/TradingChart";

const Home: NextPage = () => {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
      <Head>
        <title>Interactive Trading Chart</title>
        <meta name="description" content="Interactive trading chart with trendline drawing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '30px' }}>
          Interactive Trading Chart with Trendlines
        </h1>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <TradingChart />
        </div>

        <div style={{ 
          color: '#ccc', 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#2a2a2a', 
          borderRadius: '8px',
          maxWidth: '1200px',
          margin: '30px auto 0'
        }}>
          <h3>How to use:</h3>
          <ul>
            <li>Click "Draw Trendline" to enter drawing mode</li>
            <li>Click two points on the chart to draw a trendline</li>
            <li>Double-click any trendline info below to log coordinates to console</li>
            <li>Use "Clear All" to remove all trendlines</li>
            <li>Trendlines are automatically saved and restored on page reload</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Home;
