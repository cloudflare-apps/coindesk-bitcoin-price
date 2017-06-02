(function () {
  'use strict'

  if (!window.addEventListener) return // Check for IE9+

  // Initializations
  var options = INSTALL_OPTIONS
  var element
  var wrapper
  var cryptoPrice
  var cryptoProvider
  var cryptoHistory
  var cryptoChart
  var chartData = []
  var chartDates = []
  var style = document.createElement('style')
  var currencyDict = {
    usd: {
      symbol: '$',
      word: 'USD'
    },
    gbp: {
      symbol: '£',
      word: 'GBP'
    },
    eur: {
      symbol: '€',
      word: 'EUR'
    },
    inr: {
      symbol: '₹',
      word: 'INR'
    },
    cny: {
      symbol: '¥',
      word: 'CNY'
    }
  };

  function updateStyles () {
    style.innerHTML = '' +
    'cloudflare-app[app="bitcoin-price-widget"] crypto-wrapper { background-color: ' + options.backgroundColor + '}' +
    'cloudflare-app[app="bitcoin-price-widget"] crypto-price { color: ' + options.textColor + '}' +
    'cloudflare-app[app="bitcoin-price-widget"] crypto-provider { color: ' + options.textColor + '}' +
    'cloudflare-app[app="bitcoin-price-widget"] crypto-provider .coindesk-price,' +
    'cloudflare-app[app="bitcoin-price-widget"] crypto-provider .coindesk-price:link,' +
    'cloudflare-app[app="bitcoin-price-widget"] crypto-provider .coindesk-price:hover,' +
    'cloudflare-app[app="bitcoin-price-widget"] crypto-provider .coindesk-price:active {' +
      'color: ' + options.graphColor + '}'
  }

  function updateElement () {
    element = INSTALL.createElement(options.location, element)
    element.setAttribute('app', 'bitcoin-price-widget');

    if (!style.parentElement) {
      document.body.appendChild(style)
    }

    updateStyles()

    wrapper = document.createElement('crypto-wrapper');
    cryptoPrice = document.createElement('crypto-price');
    cryptoProvider = document.createElement('crypto-provider');
    cryptoHistory = document.createElement('crypto-history');

    cryptoPrice.textContent = 'Fetching BTC price...';

    wrapper.appendChild(cryptoPrice);

    cryptoProvider.innerHTML = 'Powered by <a class="coindesk-price" target="_blank" href="https://coindesk.com/price">CoinDesk</a>';
    wrapper.appendChild(cryptoProvider);

    var chart = document.createElement('canvas');
    chart.setAttribute('width', '400');
    chart.setAttribute('height', '100');
    wrapper.appendChild(chart);

    var ctx = chart.getContext('2d');
    cryptoChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartDates,
          datasets: [{
            label: 'BTC Prices',
            data: chartData,
            borderColor: [options.graphColor],
            borderWidth: 3
          }]
        },
        options: {
          legend: {
            display: false
          },
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: false
              }
            }]
          }
        }
    });

    element.appendChild(wrapper);
  }

  function updateHistoricalPrice (historicalData) {
    chartData = [];
    chartDates = [];

    for (var key in historicalData.bpi) {
      chartData.push(historicalData.bpi[key].toFixed(2));
      chartDates.push(key);
    }


    cryptoChart.data.labels = chartDates
    cryptoChart.data.datasets[0].data = chartData
    cryptoChart.update()
  }

  function fetchHistoricalPrice () {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function historicalDataLoaded () {
      var historicalData

      try {
        historicalData = JSON.parse(this.responseText);
      } catch (error) {
        console.error(error);
        return;
      }

      updateHistoricalPrice(historicalData)
    });

    var today = new Date();
    var theDayBefore = new Date(Date.now() - 172800000 * 2);
    var timeParams = today.toISOString().substring(0,10) + '&start=' + theDayBefore.toISOString().substring(0, 10);
    var requestURL = 'http://api.coindesk.com/v1/bpi/historical/close.json?currency=' + currencyDict[options.currency].word + '&end=' + timeParams;

    oReq.open("GET", requestURL);
    oReq.send();
  }

  function fetchPrice () {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener('load', function priceLoaded () {
      var priceData = null

      try {
        priceData = JSON.parse(this.responseText);
      } catch (error) {
        console.log(error);
        return;
      }

      var symbol = currencyDict[options.currency].symbol;
      var threeLetterWord = currencyDict[options.currency].word;

      cryptoPrice.textContent = '1 BTC = ' + symbol + priceData.bpi[threeLetterWord].rate_float.toFixed(2);
    });

    if (options.currency === 'usd' || options.currency === 'gbp' || options.currency === 'eur') {
      oReq.open('GET', "http://api.coindesk.com/v1/bpi/currentprice.json");
    } else {
      oReq.open('GET', 'http://api.coindesk.com/v1/bpi/currentprice/' + currencyDict[options.currency].word + '.json');
    }

    oReq.send();
  }

  function bootstrap () {
    updateElement();
    fetchPrice();
    fetchHistoricalPrice();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // INSTALL_SCOPE is an object that is used to handle option changes without refreshing the page.
  window.INSTALL_SCOPE = {
    setCurrency (nextOptions) {
      options = nextOptions;

      fetchPrice();
      fetchHistoricalPrice();
    },
    setColors (nextOptions) {
      options = nextOptions;

      updateStyles()

      if (cryptoChart) {
        cryptoChart.data.datasets[0].borderColor = [options.graphColor]
        cryptoChart.update()
      }
    },
    setLocation (nextOptions) {
      options = nextOptions;

      if (!wrapper || !wrapper.parentElement) return

      wrapper.parentElement.removeChild(wrapper);
      element = INSTALL.createElement(options.location, element);
      element.setAttribute('app', 'bitcoin-price-widget');

      element.appendChild(wrapper);
    }
  }
}())
