var chartDom = document.getElementById('main');
var myChart = echarts.init(chartDom);

var upColor = '#ec0000';
var downColor = '#00da3c';
var dataTime = ["2004-01-02", "2004-01-05","2004-01-06", "2004-01-07", "2004-01-08","2004-01-09", "2004-01-12", "2004-01-13", "2004-01-14", "2004-01-15",];
var dataMes = [
  [ 10452.74, 10409.85, 10367.41, 10554.96 ],
  [ 10411.85, 10544.07, 10411.85, 10575.92 ],
  [ 10543.85, 10538.66, 10454.37, 10584.07 ],
  [ 10535.46, 10529.03, 10432, 10587.55 ],
  [ 10530.07, 10592.44, 10480.59, 10651.99 ],
  [ 10589.25, 10458.89, 10420.52, 10603.48 ],
  [ 10461.55, 10485.18, 10389.85, 10543.03 ],
  [ 10485.18, 10427.18, 10341.19, 10539.25 ],
  [ 10428.67, 10538.37, 10426.89, 10573.85 ],
  [ 10534.52, 10553.85, 10454.52, 10639.03 ],
]
var volumeNum = [168890000, 221290000, 191460000, 225490000, 237770000, 223250000, 197960000, 197310000, 186280000, 260090000];//交易量

var volumeData = []//交易量添加颜色判断
for (var i = 0; i < dataMes.length; i++) {
  volumeData.push([dataTime[i], volumeNum[i], dataMes[i][0] > dataMes[i][1] ? 1 : -1]);
}

var option = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      link: {xAxisIndex: 'all'},//上下划过分开展示还是一起展示
    },
    textStyle: {
      color: '#000'
    },
    formatter: function (params) {//修改鼠标划过显示为中文

      if (params[0].componentSubType == "candlestick") {//先划过蜡烛图
	var params1 = params[0];//开盘收盘最低最高数据汇总
	var params2 = params[1].data[1];//成交量数据
      } else if (params[0].componentSubType == "bar") {//先划过成交量
	var params1 = params[1];//开盘收盘最低最高数据汇总
	var params2 = params[0].data[1];//成交量数据
      }

      var currentItemData = params1.data;//k线数据
      return params1.name + '<br>' +
	'开盘价:' + currentItemData[1] + '<br>' +
	'收盘价:' + currentItemData[2] + '<br>' +
	'最低价:' + currentItemData[3] + '<br>' +
	'最高价:' + currentItemData[4] + '<br>' +
	'成交量:' + params2
    }

    // extraCssText: 'width: 170px'
  },

  axisPointer: {
    link: {xAxisIndex: 'all'},//整体划过还是单个划过
    label: {
      backgroundColor: '#777'
    }
  },

  visualMap: {//视觉映射组，就是将数据映射到视觉元素
    show: false,
    seriesIndex: 1,//指定取哪个系列的数据，第几个图形的数据，从0开始，1代表的是成交量的柱状图
    pieces: [{//自定义『分段式视觉映射组件』的每一段的范围，以及每一段的文字，以及每一段的特别的样式
      value: 1,//value值为1则用downColor颜色的样式
      color: downColor
    }, {
      value: -1,
      color: upColor
    }]
  },
  grid: [
    {//蜡烛图的位置
      left: '10%',
      right: '8%',
      height: '50%'
    },
    {//成交量柱状图的位置
      left: '10%',
      right: '8%',
      top: '63%',
      height: '16%'
    }
  ],
  xAxis: [
    {//蜡烛图的设置
      type: 'category',
      data: dataTime,
      scale: true,
      //boundaryGap: false,
      axisLine: {onZero: false},
      splitLine: {show: false},
      splitNumber: 20,
      min: 'dataMin',
      max: 'dataMax',
      axisPointer: {
	z: 100
      },

    },
    {//成交量柱状图的设置
      type: 'category',
      gridIndex: 1,
      data: dataTime,
      scale: true,
      //boundaryGap: false,
      axisLine: {onZero: false},
      axisTick: {show: false},
      splitLine: {show: false},
      axisLabel: {show: false},
      splitNumber: 20,
      min: 'dataMin',
      max: 'dataMax'
    }
  ],
  yAxis: [
    {
      scale: true,
      splitArea: {
	show: true
      }
    },
    {
      scale: true,
      gridIndex: 1,
      splitNumber: 2,
      axisLabel: {show: false},
      axisLine: {show: false},
      axisTick: {show: false},
      splitLine: {show: false}
    }
  ],

  series: [{//蜡烛图的设置
    type: 'candlestick',
    data: dataMes,
    barWidth : 10,//图形的宽度
    itemStyle: {
      color: upColor,
      color0: downColor,
      borderColor: null,
      borderColor0: null
    },
  },
    {//成交量柱状图的设置
      name: 'Volume',
      type: 'bar',
      barWidth : 10,//柱状图的宽度
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: volumeData
    }
  ]
};

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
	data: ['KLine', 'MA5']
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

  /*
  baseDay.setDate(baseDay.getDate() + 1);
  dataTime.push(formatDatetime(baseDay));
  dataMes.push([10534.52, 10553.85, 10454.52, 10639.03]);
  volumeData.push([formatDatetime(baseDay), 260090000, 1]);
  myChart.setOption(getChartOption(data));
  */

   var items = window.fData.record.slice(index, index + 100);
   var cData = splitData(items);
   myChart.setOption(getChartOption(cData));
   index++;
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
   var stock = "sz000002";
   const URL = "/surfing.http/api.finance.ifeng.com/akdaily/";

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
