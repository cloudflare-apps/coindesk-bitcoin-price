(function () {
  'use strict'

  if (!window.addEventListener) return // Check for IE9+

  // Initializations
  var options = INSTALL_OPTIONS
  var element
  var wrapper
  var currencyDict = {
    'usd': {
      symbol: '$',
      word: 'USD'
    },
    'gbp': {
      symbol: '£',
      word: 'GBP'
    },
    'eur': {
      symbol: '€',
      word: 'EUR'
    },
    'inr': {
      symbol: '₹',
      word: 'INR'
    },
    'cny': {
      symbol: '¥',
      word: 'CNY'
    }
  };

  // updateElement runs every time the options are updated.
  // Most of your code will end up inside this function.
  function updateElement (resp) {
    element = INSTALL.createElement(options.location, element)

    // Set the app attribute to your app's dash-delimited alias.
    element.setAttribute('app', 'crypto');
    wrapper = document.createElement('crypto-wrapper');
    var cryptoPrice = document.createElement('crypto-price');
    var cryptoCredit = document.createElement('crypto-credit');
    var cryptoHistory = document.createElement('crypto-history');

    wrapper.style.backgroundColor = options.backgroundColor;

    var symbol = currencyDict[options.currency].symbol;
    var threeLetterWord = currencyDict[options.currency].word;

    cryptoPrice.textContent = "1BTC = "+symbol+resp.bpi[threeLetterWord].rate_float.toFixed(2);
    cryptoPrice.style.color = options.textColor;
    wrapper.appendChild(cryptoPrice);


    cryptoCredit.innerHTML = "<p> Powered by <a class='coindesk-price' target='_blank' href='https://coindesk.com/price'>CoinDesk</a></p>";
    cryptoCredit.style.color = options.textColor;
    wrapper.appendChild(cryptoCredit);
    element.appendChild(wrapper);
  }

  // This code ensures that the app doesn't run before the page is loaded.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateElement)
  } else {
    fetchPrice();
    fetchHistoricalPrice();
  }

  // Request Listeners
  function reqListener () {
    try {
      var response = JSON.parse(this.responseText);
      updateElement(response);
    } catch (error) {
      console.log(error);
    }
  }

  function historicalPriceListener() {
    var historicalData
    try {
      historicalData = JSON.parse(this.responseText);
    } catch (error) {
      console.log(error);
      return;
    }

    var data = [];
    var dates = [];

    for (var key in historicalData.bpi) {
      data.push(historicalData.bpi[key].toFixed(2));
      dates.push(key);
    }

    var chart = document.createElement('canvas');
    chart.setAttribute('id', 'crypto-chart');
    chart.setAttribute('width', '400');
    chart.setAttribute('height', '100');
    wrapper.appendChild(chart);

    var ctx = document.getElementById("crypto-chart").getContext('2d');
    var cryptoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'BTC Prices',
                data: data,
                borderColor: [
                    options.graphColor,
                ],
                borderWidth: 3
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:false
                    }
                }]
            }
        }
    });
  }

  // Fetchers
  function fetchHistoricalPrice() {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", historicalPriceListener);

    var today = new Date();
    var theDayBefore = new Date(Date.now() - 172800000*2);
    var timeParams = today.toISOString().substring(0,10)+"&start="+theDayBefore.toISOString().substring(0,10);
    var requestURL = "http://api.coindesk.com/v1/bpi/historical/close.json?currency="+currencyDict[options.currency].word+"&end="+timeParams;

    oReq.open("GET", requestURL);
    oReq.send();
  }

  function fetchPrice() {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);

    if (options.currency === "usd" || options.currency === "gbp" || options.currency === "eur") {
      oReq.open("GET", "http://api.coindesk.com/v1/bpi/currentprice.json");
    } else {
      oReq.open("GET", "http://api.coindesk.com/v1/bpi/currentprice/"+currencyDict[options.currency].word+".json");
    }

    oReq.send();
  }
  // INSTALL_SCOPE is an object that is used to handle option changes without refreshing the page.
  window.INSTALL_SCOPE = {
    setOptions (nextOptions) {
      options = nextOptions;

      fetchPrice();
      fetchHistoricalPrice();
    }
  }
}())
