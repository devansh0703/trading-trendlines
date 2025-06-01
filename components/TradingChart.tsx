
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, UTCTimestamp, CandlestickData, LineStyle } from 'lightweight-charts';

interface TrendlineData {
  id: string;
  startTime: UTCTimestamp;
  startPrice: number;
  endTime: UTCTimestamp;
  endPrice: number;
}

const TradingChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const lineSeriesRef = useRef<any[]>([]);
  const [trendlines, setTrendlines] = useState<TrendlineData[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingStart, setDrawingStart] = useState<{ time: UTCTimestamp; price: number } | null>(null);
  const [draggedTrendline, setDraggedTrendline] = useState<string | null>(null);
  const [dragPoint, setDragPoint] = useState<'start' | 'end' | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Generate mock OHLC data as fallback
  const generateMockData = (): CandlestickData[] => {
    const data: CandlestickData[] = [];
    const baseTime = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);
    let price = 100;

    for (let i = 0; i < 365; i++) {
      const time = (baseTime + i * 24 * 60 * 60) as UTCTimestamp;
      const change = (Math.random() - 0.5) * 4;
      const open = price;
      price += change;
      const close = price;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;

      data.push({ time, open, high, low, close });
    }

    return data;
  };

  // Fetch historical data from Binance
  const fetchBinanceData = async (): Promise<CandlestickData[]> => {
    try {
      const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=365');
      const data = await response.json();
      
      return data.map((kline: any[]) => ({
        time: Math.floor(kline[0] / 1000) as UTCTimestamp,
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
      }));
    } catch (error) {
      console.error('Failed to fetch Binance data:', error);
      return generateMockData();
    }
  };

  // Setup WebSocket for real-time data
  const setupWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');
      
      ws.onopen = () => {
        console.log('Connected to Binance WebSocket');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const kline = data.k;
        
        if (kline.x && candlestickSeriesRef.current) { // kline.x indicates if this kline is closed
          const candleData: CandlestickData = {
            time: Math.floor(kline.t / 1000) as UTCTimestamp,
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          };
          
          candlestickSeriesRef.current.update(candleData);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        // Reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  }, []);

  // Load/save trendlines
  const loadTrendlines = () => {
    try {
      const saved = localStorage.getItem('tradingChartTrendlines');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load trendlines:', error);
      return [];
    }
  };

  const saveTrendlines = (newTrendlines: TrendlineData[]) => {
    try {
      localStorage.setItem('tradingChartTrendlines', JSON.stringify(newTrendlines));
    } catch (error) {
      console.error('Failed to save trendlines:', error);
    }
  };

  // Chart click handler
  const handleChartClick = useCallback((param: any) => {
    if (!param.time || !param.point || !candlestickSeriesRef.current) return;

    const price = candlestickSeriesRef.current.coordinateToPrice(param.point.y);
    if (price === null) return;

    if (isDrawingMode) {
      if (!drawingStart) {
        setDrawingStart({
          time: param.time as UTCTimestamp,
          price,
        });
      } else {
        const newTrendline: TrendlineData = {
          id: Date.now().toString(),
          startTime: drawingStart.time,
          startPrice: drawingStart.price,
          endTime: param.time as UTCTimestamp,
          endPrice: price,
        };

        setTrendlines(prev => {
          const updatedTrendlines = [...prev, newTrendline];
          saveTrendlines(updatedTrendlines);
          return updatedTrendlines;
        });

        setDrawingStart(null);
        setIsDrawingMode(false);
      }
    } else if (draggedTrendline && dragPoint) {
      // Update dragged trendline
      setTrendlines(prev => {
        const updatedTrendlines = prev.map(t => {
          if (t.id === draggedTrendline) {
            return dragPoint === 'start' 
              ? { ...t, startTime: param.time as UTCTimestamp, startPrice: price }
              : { ...t, endTime: param.time as UTCTimestamp, endPrice: price };
          }
          return t;
        });
        saveTrendlines(updatedTrendlines);
        return updatedTrendlines;
      });

      setDraggedTrendline(null);
      setDragPoint(null);
    }
  }, [isDrawingMode, drawingStart, draggedTrendline, dragPoint]);

  // Redraw all trendlines
  const redrawTrendlines = useCallback(() => {
    if (!chartRef.current) return;

    // Remove existing line series
    lineSeriesRef.current.forEach(lineSeries => {
      chartRef.current.removeSeries(lineSeries);
    });
    lineSeriesRef.current = [];

    // Draw all trendlines
    trendlines.forEach((trendline) => {
      const lineSeries = chartRef.current.addLineSeries({
        color: draggedTrendline === trendline.id ? '#ff9800' : '#2196F3',
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        crosshairMarkerVisible: false,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      lineSeries.setData([
        { time: trendline.startTime, value: trendline.startPrice },
        { time: trendline.endTime, value: trendline.endPrice },
      ]);

      lineSeriesRef.current.push(lineSeries);
    });
  }, [trendlines, draggedTrendline]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;

    const initChart = async () => {
      try {
        const chart = createChart(chartContainerRef.current!, {
          width: chartContainerRef.current!.clientWidth,
          height: 600,
          layout: {
            background: { color: '#1e1e1e' },
            textColor: '#d9d9d9',
          },
          grid: {
            vertLines: { color: '#2B2B43' },
            horzLines: { color: '#2B2B43' },
          },
          crosshair: { mode: 1 },
          rightPriceScale: { borderColor: '#485c7b' },
          timeScale: {
            borderColor: '#485c7b',
            timeVisible: true,
            secondsVisible: false,
          },
        });

        chartRef.current = chart;

        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        candlestickSeriesRef.current = candlestickSeries;

        // Load data
        const data = await fetchBinanceData();
        candlestickSeries.setData(data);

        // Load saved trendlines
        const savedTrendlines = loadTrendlines();
        setTrendlines(savedTrendlines);

        // Setup WebSocket for real-time updates
        setupWebSocket();

        // Handle resize
        const handleResize = () => {
          if (chartContainerRef.current && chart) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (wsRef.current) {
            wsRef.current.close();
          }
          if (chart) {
            chart.remove();
          }
          chartRef.current = null;
          candlestickSeriesRef.current = null;
          lineSeriesRef.current = [];
        };
      } catch (error) {
        console.error('Error creating chart:', error);
      }
    };

    initChart();
  }, [setupWebSocket]);

  // Subscribe to chart clicks
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.subscribeClick(handleChartClick);
      return () => {
        if (chartRef.current) {
          chartRef.current.unsubscribeClick(handleChartClick);
        }
      };
    }
  }, [handleChartClick]);

  // Redraw trendlines when they change
  useEffect(() => {
    redrawTrendlines();
  }, [redrawTrendlines]);

  const startDrawing = () => {
    setIsDrawingMode(true);
    setDrawingStart(null);
  };

  const cancelDrawing = () => {
    setIsDrawingMode(false);
    setDrawingStart(null);
  };

  const deleteTrendline = (id: string) => {
    setTrendlines(prev => {
      const updatedTrendlines = prev.filter(t => t.id !== id);
      saveTrendlines(updatedTrendlines);
      return updatedTrendlines;
    });
  };

  const startDragging = (id: string, point: 'start' | 'end') => {
    setDraggedTrendline(id);
    setDragPoint(point);
    setIsDrawingMode(false);
  };

  const clearAllTrendlines = () => {
    setTrendlines([]);
    saveTrendlines([]);
  };

  return (
    <div className="trading-chart-container">
      <div className="chart-controls" style={{ marginBottom: '10px' }}>
        <button
          onClick={startDrawing}
          disabled={isDrawingMode}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: isDrawingMode ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isDrawingMode ? 'default' : 'pointer',
          }}
        >
          {isDrawingMode ? (drawingStart ? 'Click End Point' : 'Click Start Point') : 'Draw Trendline'}
        </button>
        
        {isDrawingMode && (
          <button
            onClick={cancelDrawing}
            style={{
              padding: '8px 16px',
              marginRight: '10px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}

        <button
          onClick={clearAllTrendlines}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear All
        </button>

        <span style={{ marginLeft: '20px', color: '#666' }}>
          Trendlines: {trendlines.length} | Real-time BTC/USDT from Binance
        </span>
      </div>

      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: isDrawingMode || draggedTrendline ? 'crosshair' : 'default',
        }}
      />

      {trendlines.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Trendlines (Drag endpoints to move, click delete to remove):</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {trendlines.map((trendline) => (
              <div
                key={trendline.id}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  backgroundColor: draggedTrendline === trendline.id ? '#fff3cd' : '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '12px',
                  border: draggedTrendline === trendline.id ? '2px solid #ff9800' : '1px solid #ddd',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Trendline {trendline.id}</strong>
                  <button
                    onClick={() => deleteTrendline(trendline.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px',
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Start: {new Date(trendline.startTime * 1000).toLocaleDateString()} - ${trendline.startPrice.toFixed(2)}</span>
                    <button
                      onClick={() => startDragging(trendline.id, 'start')}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '9px',
                      }}
                    >
                      Drag Start
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>End: {new Date(trendline.endTime * 1000).toLocaleDateString()} - ${trendline.endPrice.toFixed(2)}</span>
                    <button
                      onClick={() => startDragging(trendline.id, 'end')}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '9px',
                      }}
                    >
                      Drag End
                    </button>
                  </div>
                </div>
                {draggedTrendline === trendline.id && (
                  <div style={{ marginTop: '8px', padding: '4px', backgroundColor: '#e7f3ff', borderRadius: '3px' }}>
                    <strong>Dragging {dragPoint} point - Click on chart to set new position</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
