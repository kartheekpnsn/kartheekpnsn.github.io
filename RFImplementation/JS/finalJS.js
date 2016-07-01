document.getElementById("perfValues").style.visibility = "hidden";
document.getElementById("perfValues2").style.visibility = "hidden";
document.getElementById("anomalies").style.visibility = "hidden";
document.getElementById("cutoff").style.visibility = "hidden";

var calibrate = function(arr) {
	if(arr.length > 0) {
		window.location.href='loader.html';
	}
	else {
		alert('empty array');
	}
}

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
	.call(xAxis);

// name for x-axis
main.append("text")
	.attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
	.attr("transform", "translate("+ (width/2) +","+(height + padding/3)+")")  // centre below axis
	.text("Probability");

// add background color to the graph
main.append("rect")
	.attr("width", 423)
	.attr("height", 278)
	.attr("fill", "pink")
	.attr("opacity", 0.5);

main.append("rect")
	.attr("width", x(cutoff))
	.attr("height", 278)
	.attr("fill", "#3c9f26")
	.attr("opacity", 0.5);

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
	.attr("class", "tooltip")
	.style("opacity", 0);

var arr = new Array();
	
var gg = main.append("svg:g");
var dots = gg.selectAll("scatter-dots")
	.data(parentArray)
	.enter().append("svg:circle")
	.attr("cx", function(d, i) { return x(d[0][1]);})
	.attr("cy", function(d, i) { return y(i+1);})
	.attr("id", function(d, i) { return "dotId" + i;})
	.attr("r", 2.5);

//make a global variable
var index = 0;

doTransition();

function doTransition() {
	dots.transition()
		.duration(5)
		.ease('elastic')
		.attr("cx", function(d, i) { document.getElementById("iterVal").innerHTML = "Iteration: " + (index + 1); return x(d[index][1]);})
		.attr("r", function(d, i){
			if(predDetail[i] == 'FP') {
				return 3;
			}
			else if(predDetail[i] == 'FN') {
				return 3;
			}
			else {
				return 2.5;
			}
		})
		.style("fill", function(d, i){
			if(predDetail[i] == 'FP') {
				return "black";
			}
			else if(predDetail[i] == 'FN') {
				return "black"
			}
			else{
				if (d[index][1] > cutoff) {
					return "red";
				}
				else {
					return "green";
				}
			}
		})
		.each("end", function(d, i) { 
			if (i == parentArray.length -1) {//when last circle is completed
	    		index++;//increment index
	    		if (index > parentArray[1].length - 1)//the data array has length of 2
	    		{
	    			document.getElementById("perfValues").style.visibility = "visible";
	    			document.getElementById("perfValues2").style.visibility = "visible";
	    			document.getElementById("anomalies").style.visibility = "visible";
	    			document.getElementById("cutoff").style.visibility = "visible";

	    			document.getElementById("cutoffs").innerHTML = ", No. of Anomalies: 100";
	    			document.getElementById("fpr").innerHTML = "Cutoff: " + cutoff + ", Anomalies Missed: " + fnCount + ", False Positives: " + fpCount;
	    			document.getElementById("precision").innerHTML = "Precision: " + precision + "%, Recall: " + recall + "%";
					toolTip();
	      			return;
	    		}
	    		doTransition();//do the transition
	  		}
		});
}

function toolTip(){
	dots.on("mouseover", function(d, i) {
		tooltip.transition()
			.duration(200)
			.style("opacity", .9);
		tooltip.html("(Point: " + (i + 1) + ", Prob: " + d[index-1][1] + ")")
			.style("left", (d3.event.pageX + 5) + "px")
			.style("top", (d3.event.pageY - 18) + "px");
	})
	.on("mouseout", function(d) {
		tooltip.transition()
			.duration(500)
			.style("opacity", 0);
	});

	dots.on('click', function (d, i) {
		d3.select("#dotId" + i)
			.attr('r', 5)
			.style('fill', function(d, i){
				if(d[index - 1][1] > cutoff) {
					return "green";
				}
				else if(d[index - 1][1] <= cutoff) {
					return "red";
				}
			});
		arr.push(i); });
}

var runFun =  function()
{
	if(arr.length > 0 )
		console.log(arr);
	else
		console.log("Array length is empty");
}
