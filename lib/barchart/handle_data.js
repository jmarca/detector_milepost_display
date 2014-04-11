var d3 = require('d3')
var _  = require('lodash')
var barChart = require('./barchart')
// date looks like "2007-01-04 16:00"
var ts_regex=/(\d*-\d*-\d*)\s(\d*:\d*)/
function parseDate(d) {
    var match = ts_regex.exec(d)
    var canonical_date = [match[1],'T',match[2],':00-0800'].join('')
    return new Date(canonical_date)
}

// Various formatters.
var formatNumber = d3.format(",d"),
    formatChange = d3.format("+,d"),
    formatDate = d3.time.format("%B %d, %Y"),
    formatDOW = //d3.time.format("%a"),
function(d){
    return dow[d]
},
    formatTime = d3.time.format("%I:%M %p");

var custom_time_format = d3.time.format.multi([
    [".%L", function(d) { return d.getMilliseconds(); }],
    [":%S", function(d) { return d.getSeconds(); }],
    ["%I:%M", function(d) { return d.getMinutes(); }],
    ["%I %p", function(d) { return d.getHours(); }],
    ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
    ["%b %d", function(d) { return d.getDate() != 1; }],
    ["%b %y", function(d) { return d.getMonth(); }],
    ["%Y", function() { return true; }]
]);

var formatTOD = function(d){
    if (d===0) return '12:00 AM'
    if (d<12) return d+':00 AM'
    if (d===12) return '12:00 PM'
    return d-12 + ':00 PM'
}

// A nest operator, for grouping hourly data by day
var nestByDate = d3.nest()
                 .key(function(d) { return d3.time.day(d.date); });

function correct_detector_ids(id,direction){
    if(!id){
        return null
    }
    if(!direction){
        throw new Error('direction required')
    }
    var match = /wimid_(\d{1,3})/.exec(id)
    if(match && match [1]){
       return ["wim",match[1],direction].join('.')
    }else{
        // vds case
        match = /(\d{5,7})/.exec(id)
        //console.log(match[0],match[1])
        return match[1]
    }

}
function data(doc){
    chart_class = chart_class || ".banana"
    // doc has keys
    // [detector_id,direction,features,component_details]
    // features is a list of records, each iwth keys:
    //  [components,date,direction]
    //

    var lookup = {}
    var records = doc.features
    records = doc.features.map(function(v){
                  var record = v
                  record.direction = record.direction.substr(0,1).toUpperCase()
                  record.upstream = correct_detector_ids(record.components[0]
                                                        ,record.direction)
                  record.downstream = correct_detector_ids(record.components[2]
                                                          ,record.direction)
                  record.detector = correct_detector_ids(record.components[1]
                                                        ,record.direction)
                  record.date=new Date(record.date)
                  return record
              })

    var components = doc.components
    // once in a while components is null.  That is a bug on the
    // server, but let's not crash here because of it.
    var baseline = components[0]
    var i = 0
    while(!baseline){
        i++
        baseline = components[i]
    }

    var details = {}
    _.forEach(doc.component_details,function(v,k){
        if(v){
            details[k]=v
            details[k].id=k
            return null
        }
        //console.log('failed on key '+k)
        //console.log(JSON.stringify(v))
        return null
    })

    var minmax = _.reduce(details
                         ,function(mm,record){
                              if(! record ){
                                  return mm
                              }
                              mm.min = mm.min < record.abs_pm ?
                                  mm.min : record.abs_pm
                              mm.max = mm.max > record.abs_pm ?
                                  mm.max : record.abs_pm
                              return mm
                          }
                         ,{min:details[baseline].abs_pm
                          ,max:details[baseline].abs_pm}
                         )

    var detector_abspm = details[records[0].detector].abs_pm

    var charts = [


        barChart()
        .data(records)
        .key('date')
        .minvalue(function(d){
            if(d){
                if(d.upstream && details[d.upstream]){
                    return detector_abspm + (details[d.upstream].abs_pm - detector_abspm)/2
                }
                return detector_abspm-0.25 // cheat back quarter mile
            }
            // not d, so use components
            return minmax.min
        })
        .maxvalue(function(d){
            if(d){
                if(d.downstream && details[d.downstream]){
                    return detector_abspm + (details[d.downstream].abs_pm - detector_abspm)/2
                }
                return detector_abspm+0.25 // cheat forward quarter mile
            }
            // not d, so use components
            return minmax.max
        })
        .value(function(d){
            return details[d.detector].abs_pm
        })
        .xlabel('time')
        .ylabel('milepost')
        .yextras(_.values(details))
        //.detectors(details)
        //.round(d3.time.day.round)
        .x(d3.time.scale()
           .rangeRound([0, 10 * 90]))
        .xTickFormat(custom_time_format)


    ];

    if(click_handler){
        _.forEach(charts,function(chart){
            return chart.click_handler(click_handler)
        })
    }

    // set up the time and day checkboxes

    // Given our array of charts, which we assume are in the same order as the
    // .chart elements in the DOM, bind the charts to the DOM and render them.
    // We also listen to the chart's brush events to update the display.

    var chart = d3.selectAll(chart_class)
                .data(charts, function(d) {return doc.detector })

                .each(function(chart) {
                    if(chart.on !== undefined ){
                        chart.on("brush", renderAll).on("brushend", renderAll);
                    };
                });


        // 1. exit
    var charts = d3.selectAll(chart_class)
    var gs = charts.selectAll("g").transition()
    var svgs = charts.selectAll("svg")
                  .transition()

    gs
    .style("opacity", 0)
    .remove();
    gs.each('end',function(){
        svgs
        .style("opacity", 0)
        .remove();
    })


    // enter
    if(svgs.empty()){
        chart.each(render)
    }else{
        // console.log('svg transition is not empty')
        var enterTransition = svgs.each('end',function() {
                                  chart.each(render)
                                  .style("opacity", 0)
                                  .transition()
                                  .style("opacity", 1);
                              });
    }


//    clear(renderAll);

    //renderAll();

    // Renders the specified chart or list.
    function render(method) {
        //console.log('rendering')
        d3.select(this).call(method);
    }

    // Whenever the brush moves, re-rendering everything.
    function renderAll() {
        console.log('hello San Dimas')
        chart.each(render);
    }

    window.renderAll = renderAll
  // window.filter = function(filters) {
  //   filters.forEach(function(d, i) { charts[i].filter(d); });
  //   renderAll();
  // };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };


    return null
}

var transition = d3.transition()
                 .duration(750)
                 .ease("linear");

var chart_class = '.banana' //make sure setting is working right
var click_handler;

data.chart_class=function(_){
    if (!arguments.length) return chart_class;
    chart_class = _;
    return data;
}
data.click_handler=function(_){
    click_handler=_;
    return data;
}
data.clear=function(){
    clear()
    return data
}
module.exports=data
