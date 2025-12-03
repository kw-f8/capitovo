// TradingViewWidget.jsx
import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef();

  useEffect(
    () => {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "symbols": [
            {
              "proName": "CAPITALCOM:US30",
              "title": "Dow Jones Industrial Average"
            },
            {
              "proName": "VANTAGE:SP500",
              "title": "S&P 500"
            },
            {
              "proName": "NASDAQ:NDX",
              "title": "NDX"
            },
            {
              "proName": "XETR:DAX",
              "title": "DAX Performance Index"
            },
            {
              "proName": "BITSTAMP:BTCUSD",
              "title": "Bitcoin"
            }
          ],
          "colorTheme": "light",
          "locale": "de_DE",
          "largeChartUrl": "",
          "isTransparent": true,
          "showSymbolLogo": true,
          "displayMode": "regular"
        }`;
      container.current.appendChild(script);
    },
    []
  );

  return (
    <div className="tradingview-widget-container" ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright"><a href="https://de.tradingview.com/markets/" rel="noopener nofollow" target="_blank"><span className="blue-text">Track all markets on TradingView</span></a></div>
    </div>
  );
}

export default memo(TradingViewWidget);
