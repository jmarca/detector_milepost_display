what does the data look like?

components, array [0,1,2], where 0 is upstream, 2 is downstream
date
direction

So for each date, I have the upstream, downstream detectors

within the data loop,

``` javascript
g.selectAll(".bar").attr("d",barPath)
```

now, .bar has datum

``` javascript
g.selectAll(".bar")
.data(["background", "foreground"])
.enter().append("path")
.attr("class", function(d) { return d + " bar"; })
.datum(group.all());
```

so what that means is that each of foreground and background has the
same data, which is all the data, and then you have some clip path
applied to separate foreground and background.

the actual path of the barchart is given by applytng thie function
barPath:

``` javascript
        function barPath(groups) {
            var path = [],
                i = -1,
                n = groups.length,
                barWidth = n/width,
                d;
            while (++i < n) {
                d = groups[i];
                path.push("M", x(d.key), ",", height, "V", y(d.value), "h",barWidth,"V", height);
            }
            return path.join("");
        }

```
What that does is to make a single path string that draws the entire
set of data.  The array `path` that is made is each record some values
like
```
M123,456V345h10V300
```

so move to (123,456) up to 345 over 10, down to 300.  The top of the
skyscraper.


And then you have to resize at some point.


``` javascript
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
```
