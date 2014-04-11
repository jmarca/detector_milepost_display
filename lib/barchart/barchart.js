var d3 = require('d3')

module.exports=barChart
function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 70, left: 160},
        x,
        y = d3.scale.linear().range([300, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        yaxis = d3.svg.axis().orient("left"),
        brush = d3.svg.brush(),
        brushDirty,
        data,
        key,
        minvalue,
        maxvalue,
        value,
        xlabel,
        xTickFormat,
        ylabel,
        yextras,
        click_handler,
        formatNumber = d3.format(",d");

    function chart(div) {
        var width = x.range()[1],
            height = y.range()[0];


        var maxx=data[data.length-1][key]
          ,minx=data[0][key]
          ,miny=minvalue()
          ,maxy=maxvalue()
        if(miny>maxy){
            var t = maxy
            maxy=miny
            miny=t
        }
        data.forEach(function(val,idx){
            val.min = minvalue(val)
            val.max = maxvalue(val)
        });

        y.domain([miny,maxy]);
        x.domain([minx,maxx])

        axis.scale(x);
        if(xTickFormat){
            axis.tickFormat(xTickFormat)
        }
        brush.x(x);

        yaxis.scale(y);


        div.each(function() {
            var div = d3.select(this),
                g = div.select("g");

            // Create the skeletal chart.
            if (g.empty()) {
                div.select(".title").append("a")
                .attr("href", "javascript:reset(" + id + ")")
                .attr("class", "reset")
                .text("reset")
                .style("display", "none");

                g = div.append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                g.append("clipPath")
                .attr("id", "clip-" + id)
                .append("rect")
                .attr("width", width)
                .attr("height", height);

                g.selectAll(".bar")
                .data(["background", "foreground"])
                .enter().append("path")
                .attr("class", function(d) { return d + " bar"; })
                .datum(data);

                g.selectAll(".foreground.bar")
                .attr("clip-path", "url(#clip-" + id + ")");

                g.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + height + ")")
                .call(axis);

                // Add the y-axis.
                g.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0,0)")
                .call(yaxis);

                if(yextras){
                    g.append('g')
                    .selectAll(".detector")
                    .data(yextras)
                    .enter().append('g')
                    .attr('class', 'y axis label detector')
                    .attr('transform', function(d){
                        return 'translate('+(-margin.left/3)+','+ y(d.abs_pm)+')'
                    })
                    .append('svg:text')
                    .style('stroke','none')
                    .text(function(d){
                        return d.id
                    })
                    .attr('text-anchor','end')

                    //.attr('transform','rotate(-10)')


                    if(click_handler){
                        g.selectAll(".detector")
                        .on('click',click_handler)
                        .on('mouseover',function(){
                            d3.select(this).attr("cursor","pointer")
                        })
                    }
                }
                if(xlabel){
                    g.append('g')
                    .attr('class', 'x axis label')
                    .attr('transform', 'translate('+(width/2)+',' + (height+margin.top+margin.bottom/2) + ')')
                    .append('svg:text')
                    .style('stroke','none')
                    .attr('text-anchor', 'middle')
                    .text(xlabel);

                }
                if(ylabel){
                    g.append('g')
                    .attr('class', 'y axis label')
                    .attr('transform', 'translate(-42,' + (height/2) + ') rotate(-90)')
                    .append('svg:text')
                    .style('stroke','none')
                    .attr('text-anchor', 'middle')
                    .text(function(d){
                        var t = 'absolute milepost'
                        if(yextras){
                            t = yextras[0].freeway + ' freeway, '+t
                        }
                        return t
                    });

                }
                // Initialize the brush component with pretty resize handles.
                var gBrush = g.append("g").attr("class", "brush").call(brush);
                gBrush.selectAll("rect").attr("height", height);
                gBrush.selectAll(".resize").append("path").attr("d", resizePath);
            }else{
                // redraw the xaxis
                g.select("g.axis")
                .call(axis);
                g.select("g.y.axis")
                .call(yaxis);

            }

            // Only redraw the brush if set externally.
            if (brushDirty) {
                brushDirty = false;
                g.selectAll(".brush").call(brush);
                div.select(".title a").style("display", brush.empty() ? "none" : null);
                if (brush.empty()) {
                    g.selectAll("#clip-" + id + " rect")
                    .attr("x", 0)
                    .attr("width", width);
                } else {
                    var extent = brush.extent();
                    g.selectAll("#clip-" + id + " rect")
                    .attr("x", x(extent[0]))
                    .attr("width", x(extent[1]) - x(extent[0]));
                }
            }

            g.selectAll(".bar").attr("d", barPath);
        });

        function barPath(groups) {
            var path = []
            var i = -1
            var n = groups.length
            var barWidth = width/(1.5*n)
            var d

            while (++i < n) {
                d = groups[i];
                path.push("M", x(d[key]), ",", y(d.min), "V", y(d.max), "h",barWidth,"V", y(d.min))
                // path.push("M", x(d[key]), ",", minvalue(d), "V", maxvalue(d), "h",barWidth,"V", minvalue(d))
            }
            return path.join("");
        }

        function resizePath(d) {
            var e = +(d == "e"),
                x = e ? 1 : -1,
                y = height / 3;
            return "M" + (.5 * x) + "," + y
                 + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                 + "V" + (2 * y - 6)
                 + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                 + "Z"
                 + "M" + (2.5 * x) + "," + (y + 8)
                 + "V" + (2 * y - 8)
                 + "M" + (4.5 * x) + "," + (y + 8)
                 + "V" + (2 * y - 8);
        }
    }

    chart.x = function(_) {
                        if (!arguments.length) return x;
                        x = _;
                        axis.scale(x);
                        brush.x(x);
                        return chart;
                    };
    chart.y = function(_) {
        if (!arguments.length) return y;
        y = _;
        yaxis.scale(y);
       return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.data = function(_) {
                          if (!arguments.length) return data;
                          data = _;
                          return chart;
                      };

    // which field is the key, or x value
    chart.key = function(_) {
                          if (!arguments.length) return key;
                          key = _;
                          return chart;
                      };

    // assign callback to minvalue, or minvalue, or field.
    chart.minvalue = function(_) {
                          if (!arguments.length) return minvalue;
                          minvalue = _;
                          return chart;
                      };

    // assign callback to maxvalue, or maxvalue, or field.
    chart.maxvalue = function(_) {
                          if (!arguments.length) return maxvalue;
                          maxvalue = _;
                          return chart;
                      };

    // assign callback to value, or value, or field.
    chart.value = function(_) {
                          if (!arguments.length) return value;
                          value = _;
                          return chart;
                      };

    chart.xlabel = function(_) {
        if (!arguments.length) return xlabel;
        xlabel = _;
        return chart;
    };

    chart.xTickFormat = function(_) {
        if (!arguments.length) return xTickFormat;
        xTickFormat = _;
        return chart;
    };


    chart.ylabel = function(_) {
        if (!arguments.length) return ylabel;
        ylabel = _;
        return chart;
    };

    chart.yextras = function(_) {
        if (!arguments.length) return yextras;
        yextras = _;
        return chart;
    };
    chart.click_handler = function(_) {
        if (!arguments.length) return click_handler;
        click_handler = _;
        return chart;
    };

    return d3.rebind(chart, brush, "on");
}
