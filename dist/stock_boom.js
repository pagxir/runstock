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
	data: ['KLine', 'MA5', 'MA20']
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
	}
      },{
	name: 'MA20',
	type: 'line',
	data: calculateMA(data, 20),
	smooth: true,
	lineStyle: {
	  normal: {
	    opacity: 0.5
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
var addOneDay = () => {
    var items = window.fData.record.slice(index, index + 120);
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
	    { data: data.vols}
	]
    };

    if (index + 120 < window.fData.record.length) index++;
    myChart.setOption(cOption);
}


new Vue({
  el: '#fxrate',
  data: function () {
    this.chartSettings = {
      digit: 4,
      scale: [true, true],
      offsetY: 5.0
    }

    this.chartExtend = {
        series: {
  	  symbol: "none"
        }
    }
    return { }
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
       setInterval(addOneDay, 5000);
       // this.chartData.rows = response.body;
   }, response => {
       // error callback
   });
  }
})
