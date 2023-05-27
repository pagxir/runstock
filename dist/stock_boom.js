var chartDom = document.getElementById('main');
var myChart = echarts.init(chartDom);

var dataTime = [];
var dataMes = [];
var volumeData = [];

function calculateMA(cData, dayCount) {

  var sum = 0;
  var result = [];
  var data = cData;

  for (var i = 0, len = data.times.length; i < len; i++) {
      if (i < dayCount) {
	sum += parseFloat(data.datas[i][1]);
	result.push('-');
	continue;
      }

      sum += (parseFloat(data.datas[i][1]) - parseFloat(data.datas[i - dayCount][1]));
      result.push((sum / dayCount).toFixed(2));
  }

  return result;
}

function getTR(items, refclose)
{
    // open, close, low, high

    var low = parseFloat(items[2]);
    var high = parseFloat(items[3]);
    var closeref = parseFloat(refclose);
    
    if (closeref < low) low = closeref;
    if (closeref > high) high = closeref;
    return high - low;
}

function calculateATR(cData, dayCount) {

  var sum = 0;
  var result = [];
  var data = cData;

  for (var i = 0, len = data.times.length; i < len; i++) {
      if (i < dayCount) {
	sum += getTR(data.datas[i], i > 1? data.datas[i - 1][1]: data.datas[0][1]);
	result.push('-');
	continue;
      }

      sum += (getTR(data.datas[i], data.datas[i - 1][1]) - getTR(data.datas[i - dayCount], i > dayCount + 1? data.datas[i - dayCount -1][1]: data.datas[0][1]));
      result.push((parseFloat(data.datas[i][1]) - 2 * (sum / dayCount)).toFixed(2));
  }

  return result;
}

var theMarkPoints = [];
var curMarkPoint = {};
var newMarkPoint = false;

function calculateMarkPoint(cData) {

  var result = [];
  var data = cData;

  /*
  for (var i = 0, len = data.times.length; i < len; i++) {
      result.push({name: "max", value: "B", xAxis: data.times[i], yAxis: data.datas[i][1]});
  }
  */

  if (newMarkPoint) {
    newMarkPoint = false;
    theMarkPoints.push(curMarkPoint);
  }

  return theMarkPoints;
}

function getChartOption(data) {

  var cOption = {
    title: {
      text: 'K线图',
      left: 0
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
	  type: 'line'
      }
    },
    legend: {
	data: ['KLine', 'MA5', 'MA20', 'ATR', 'BS']
    },
    grid: [{
	left: '3%',
	right: '1%',
	height: '60%'
    },{
	left: '3%',
	right: '1%',
	top: '75%',
	height: '20%'
    }],
    xAxis: [{
      type: 'category',
      data: data.times,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      splitNumber: 20,
      min: 'dataMin',
      max: 'dataMax'
    },{
      type: 'category',
      gridIndex: 1,
      data: data.times,
      axisLabel: {show: false}
    }],
    yAxis: [{
      scale: true,
      splitArea: {
	show: false
      }
    },{
      gridIndex: 1,
      splitNumber: 3,
      axisLine: {onZero: false},
      axisTick: {show: false},
      splitLine: {show: false},
      axisLabel: {show: true}
    }],
    dataZoom: [
      {type: 'inside', xAxisIndex: [0, 0], start: 20, end: 100 },
      {show: true, xAxisIndex: [0, 1], type: 'slider', top: '97%', start: 20, end: 100 }
    ],
    series: [
      {
	name: 'K线图',
	type: 'candlestick',
	data: data.datas,
	itemStyle: { normal: { color: '#ef232a', color0: '#14b143', borderColor: '#ef232a', borderColor0: '#14b143'}},
      },{
	name: 'MA5',
	type: 'line',
	data: calculateMA(data, 5),
	smooth: true,
	lineStyle: {
	  normal: {
	    opacity: 0.5
	  }
	},
      },{
	name: 'MA20',
	type: 'line',
	data: calculateMA(data, 20),
	smooth: true,
	lineStyle: {
	  normal: {
	    opacity: 0.5
	  }
	},
      },{
	name: 'ATR',
	type: 'line',
	data: calculateATR(data, 13),
	smooth: true,
	lineStyle: {
	  normal: {
	    opacity: 0.5
	  }
	},
      },{
	name: 'BS',
	type: 'line',
	data: [],
	markPoint:  {
		data: calculateMarkPoint(data),
		label: {
			formatter: '{c}'
		}
	}
      },{
	name: 'Volumn',
	type: 'bar',
	xAxisIndex: 1,
	yAxisIndex: 1,
	data: data.vols,
	itemStyle: { normal: { color: (params) => (data.datas[params.dataIndex][1] > data.datas[params.dataIndex][0])? '#ef232a': '#14b143' }}
    }]
  };

  return cOption;
}

var data = {
	times: dataTime,
	datas: dataMes,
	vols: volumeData
};

myChart.setOption(getChartOption(data));

var baseDay = new Date("2004-01-15");
var formatDatetime = d => {
    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    var date  = d.getDate();
    return year + "-" + month + "-" + date;
}

function splitData(rawData) {
  var vols = [];
  var datas = [];
  var times = [];
        
  datas = rawData.map(item => [item[1], item[3], item[4], item[2]]);
  times = rawData.map(item => item[0]);
  vols  = rawData.map(item => item[5]);
    
  return {
    datas: datas,
    times: times,
    vols: vols 
  };
}

var index = 0;

new Vue({
  el: '#fxrate',
  data: function () {
    return { stock: 0, money: 0, price: 0, advStopLimit: 0, curStopLimit: 0}
  },
  methods: {
    sell(event) {
        if (this.stock > 0) {
	    this.money = this.money + parseFloat(this.price);
	    curMarkPoint = {name: "max", value: "S", xAxis: this.xAxis, yAxis: this.price};
	    newMarkPoint = true;
	    this.stock--;
	}
    },
    buy(event) {
	if (this.price > 0) {
	    this.money = this.money - parseFloat(this.price);
	    if (parseFloat(this.price) < this.curStopLimit) this.curStopLimit = 0;
	    curMarkPoint = {name: "max", value: "B", xAxis: this.xAxis, yAxis: this.price};
	    newMarkPoint = true;
	    this.stock++;
	}
    },
    stopLimit(event) {
	if (this.advStopLimit && parseFloat(this.advStopLimit) > 0) {
	   this.curStopLimit = parseFloat(this.advStopLimit);
	}
    },
    addOneDay() {
      var items = window.fData.record.slice(index, index + 120);
      if (index + 120 < window.fData.record.length) index++;
      else items = window.fData.record;
      var data = splitData(items);

      var cOption = {
	xAxis: [
	  { data: data.times },
	  { data: data.times }
	],
	series: [
	  { data: data.datas},
	  { data: calculateMA(data, 5)},
	  { data: calculateMA(data, 20)},
	  { data: calculateATR(data, 13)},
	  { markPoint: { data: calculateMarkPoint(data) }},
	  { data: data.vols}
	]
      };

      this.price = data.datas[data.datas.length -1][1];
      this.advStopLimit = data.datas[data.datas.length -1][2];
      this.xAxis = data.times[data.datas.length -1];

      var lowbound = parseFloat(data.datas[data.datas.length -1][0]);
      if (lowbound > parseFloat(this.price)) {
	  lowbound = parseFloat(this.price);
      }

      if (lowbound * 0.99 > parseFloat(this.advStopLimit)) {
	  this.advStopLimit = lowbound * 0.99;
      } else {
	  this.advStopLimit = (parseFloat(this.advStopLimit) + lowbound * 0.99) / 2;
      }

      if (this.curStopLimit > 0 && this.advStopLimit  < this.curStopLimit && this.stock > 0) {
	theMarkPoints.push({name: "max", value: "!", xAxis: this.xAxis, yAxis: this.price});
	var highMark = parseFloat(data.datas[data.datas.length -1][0]);
	var thisPrice = parseFloat(this.price);
	this.money = this.money + this.stock * (highMark < thisPrice? highMark: thisPrice);
	this.curStopLimit = 0;
	this.stock = 0;
      }

      myChart.setOption(cOption);
    }
  },
  created: function() {
   var type = "last";
   var stock = "sz002230";
   var indexies = ["sz399971", "sz399989", "sz399997", "sh000807", "399441", "sh000687", "sh000685", "sz399438", "sz399359", "sz399973", "sz399995", "sh000906", "sz399699", "sz399030", "sz399231", "sh000941", "sh000808", "sh000932", "sz399967", "sz399928", "sh000949", "sz399440", "sz399808", "sz399986", "sh000978", "sz399976", "sz399998", "sh000819"];
   const URL = "/surfing.http/api.finance.ifeng.com/akdaily/";

   var cone = Math.floor(Math.random() * indexies.length);
   if (cone < indexies.length) stock = indexies[cone];

   this.$http.get(URL, {params: {code: stock, type: type}}).then(response => {
       const length = response.body.record.length;

       // var myChart = echarts.init(document.getElementById("chart"))
       var cData = splitData(response.body.record);
       myChart.setOption(getChartOption(cData));
       window.fData = response.body;
       this.addOneDay();
       setInterval(this.addOneDay.bind(this), 5000);
       // this.chartData.rows = response.body;
   }, response => {
       // error callback
   });
  }
})
