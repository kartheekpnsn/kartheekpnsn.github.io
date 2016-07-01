var padding = 100;

var margin = {top: 20, right: 15, bottom: 60, left: 60}
	, width = 500 - margin.left - margin.right
	, height = 360 - margin.top - margin.bottom;

var x = d3.scale.linear()
	.domain([0, 1])//d3.max(data, function(d) { return d[0]; })])
	.range([ 0, width]);

//alert (data[0][0]);

var y = d3.scale.linear()
	.domain([0, 100])//d3.max(data, function(d) { return d[1]; })])
	.range([ height, 0 ]);

var chart = d3.select('body')
	.append('svg:svg')
	.attr('width', width + margin.right + margin.left)
	.attr('height', height + margin.top + margin.bottom)
	.attr('class', 'chart')

var main = chart.append('g')
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
	.attr('width', width)
	.attr('height', height)
	.attr('class', 'main')   

// draw the x axis
var xAxis = d3.svg.axis()
	.scale(x)
	.orient('bottom');

main.append('g')
	.attr('transform', 'translate(0,' + height + ')')
	.attr('class', 'main axis date')
	.attr("opacity", 0.1)
	.call(xAxis);

// name for x-axis
/*main.append("text")
	.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
	.attr("transform", "translate("+ (width/2) +","+(height + padding/3)+")")  // centre below axis
	.attr("opacity", 0.1)
	.text("Probability");*/

/*// add background color to the graph
main.append("rect")
	.attr("width", 423)
	.attr("height", 278)
	.attr("fill", "pink")
	.attr("opacity", 0.1);

main.append("rect")
	.attr("width", x(cutoff))
	.attr("height", 278)
	.attr("fill", "#3c9f26")
	.attr("opacity", 0.1);*/