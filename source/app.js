(function () {
  'use strict'

  if (!window.addEventListener) return // Check for IE9+

  var options = INSTALL_OPTIONS
  var element
  var wrapper

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

    var symbol = "$";
    var currencySymbol = "USD"

    if (options.currency === "gbp") {
      symbol = "£";
      currencySymbol = "GBP"
    } else if (options.currency === "eur") {
      symbol = "€";
      currencySymbol = "EUR";
    } else if (options.currency === "inr") {
      symbol = "₹";
      currencySymbol = "INR";
    } else if (options.currency === "cny") {
      symbol = "¥";
      currencySymbol = "CNY";
    }

    wrapper.style.backgroundColor = options.backgroundColor;

    cryptoPrice.textContent = "1BTC = "+symbol+resp["bpi"][currencySymbol]["rate_float"].toFixed(2);
    cryptoPrice.style.color = options.textColor;
    wrapper.appendChild(cryptoPrice);


    cryptoCredit.innerHTML = "<p> Powered by <a class='coindesk-price' href='https://coindesk.com/price'>CoinDesk</a></p>";
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

  function reqListener () {
    updateElement(JSON.parse(this.responseText));
  }

  function historicalPriceListener() {
    var historicalData = JSON.parse(this.responseText);

    var data = [];
    var dates = [];

    for (var key in historicalData['bpi']) {
      data.push(historicalData['bpi'][key].toFixed(2));
      dates.push(key);
    }

    var chart = document.createElement('canvas');
    chart.setAttribute('id', 'myChart');
    chart.setAttribute('width', '400');
    chart.setAttribute('height', '100');
    wrapper.appendChild(chart);

    var ctx = document.getElementById("myChart").getContext('2d');
    var myChart = new Chart(ctx, {
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

  function fetchHistoricalPrice() {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", historicalPriceListener);

    var today = new Date();
    var theDayBefore = new Date(Date.now() - 172800000*2);
    var timeParams = today.toISOString().substring(0,10)+"&start="+theDayBefore.toISOString().substring(0,10);
    var requestURL

    if (options.currency === "usd") {
      requestURL = "http://api.coindesk.com/v1/bpi/historical/close.json?currency=USD&end="+timeParams;;
    } else if (options.currency === "gbp") {
      requestURL = "http://api.coindesk.com/v1/bpi/historical/close.json?currency=GBP&end="+timeParams;;
    } else if (options.currency === "eur") {
      requestURL = "http://api.coindesk.com/v1/bpi/historical/close.json?currency=EUR&end="+timeParams;;
    } else if (options.currency === "cny"){
      requestURL = "http://api.coindesk.com/v1/bpi/historical/close.json?currency=CNY&end="+today.toISOString().substring(0,10)+"&start="+theDayBefore.toISOString().substring(0,10);
    } else if (options.currency === "inr") {
      requestURL = "http://api.coindesk.com/v1/bpi/historical/close.json?currency=INR&end="+today.toISOString().substring(0,10)+"&start="+theDayBefore.toISOString().substring(0,10);
    }

    oReq.open("GET", requestURL);
    oReq.send();
  }

  function fetchPrice() {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);

    if (options.currency === "usd" || options.currency === "gbp" || options.currency === "eur") {
      oReq.open("GET", "http://api.coindesk.com/v1/bpi/currentprice.json");
    } else if (options.currency === "cny"){
      oReq.open("GET", "http://api.coindesk.com/v1/bpi/currentprice/CNY.json");
    } else if (options.currency === "inr") {
      oReq.open("GET", "http://api.coindesk.com/v1/bpi/currentprice/INR.json");
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
