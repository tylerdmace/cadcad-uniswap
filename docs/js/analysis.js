'use strict';

window.addEventListener('load', () => {
    const blueSelection = document.getElementById('river-selection-blue');
    const whiteSelection = document.getElementById('river-selection-white');
    const atbaraSelection = document.getElementById('river-selection-atbara');
    const allSelection = document.getElementById('river-selection-all');
    const reserveSelection = document.getElementById('reserve-selection');
    const reserveSelectionDetails = document.getElementById('reserve-selection-details');
    const runSimulationButton = document.getElementById('run-simulation');

    blueSelection.addEventListener('change', handleRiverChange);
    whiteSelection.addEventListener('change', handleRiverChange);
    atbaraSelection.addEventListener('change', handleRiverChange);
    allSelection.addEventListener('change', handleRiverChange);
    reserveSelection.addEventListener('change', handleReserveChange);
    runSimulationButton.addEventListener('click', runSimulation);
    
    let river = 'all';
    let reserve = '10';
    
    function handleReserveChange(event) {
        reserve = event.target.value;
        reserveSelectionDetails.innerHTML = reserve;
    }

    function handleRiverChange(event) {
        river = event.target.value;
    }
    
    function runSimulation() {
        renderRiverFlowRate(river);
        renderReservoirLevel(reserve);
        renderScatterPlot();
        renderDonut();
        renderRidgeline();
    }
    
    function setDefaults() {
        reserveSelection.value = reserve;
        allSelection.checked = true;
        reserveSelectionDetails.innerHTML = reserve;
    }
    
    function renderRidgeline() {
        d3.select("#ridgeline").select("svg").remove();
        
        // set the dimensions and margins of the graph
        const margin = {top: 80, right: 30, bottom: 50, left:110},
            width = 800 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select("#ridgeline")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform",
                  `translate(${margin.left},${margin.top})`);

        //read data
        d3.csv("https://raw.githubusercontent.com/zonination/perceptions/master/probly.csv").then(function(data) {

          // Get the different categories and count them
          const categories = ["Almost Certainly", "Very Good Chance", "We Believe", "Likely", "About Even", "Little Chance", "Chances Are Slight", "Almost No Chance" ];
          const n = categories.length;

          // Compute the mean of each group
          let allMeans = [];
          
          for (let i in categories){
            let currentGroup = categories[i]
            let mean = d3.mean(data, function(d) { return +d[currentGroup] })
            allMeans.push(mean)
          }

          // Create a color scale using these means.
          const myColor = d3.scaleSequential()
            .domain([0,100])
            .interpolator(d3.interpolateViridis);

          // Add X axis
          const x = d3.scaleLinear()
            .domain([-10, 120])
            .range([ 0, 50 ]);
          const xAxis = svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickValues([0,25, 50, 75, 100]).tickSize(-height) )

          // Add X axis label:
          svg.append("text")
              .attr("fill", "white")
              .attr("text-anchor", "end")
              .attr("x", width)
              .attr("y", height + 40)
              .text("Probability (%)");

          // Create a Y scale for densities
          const y = d3.scaleLinear()
            .domain([0, 0.25])
            .range([ height, 0]);

          // Create the Y axis for names
          const yName = d3.scaleBand()
            .domain(categories)
            .range([0, height])
            .paddingInner(1)
          svg.append("g")
            .call(d3.axisLeft(yName).tickSize(0))
            .select(".domain").remove()

          // Compute kernel density estimation for each column:
          const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40)) // increase this 40 for more accurate density.
          let allDensity = []
          for (let i = 0; i < n; i++) {
              let key = categories[i]
              let density = kde( data.map(function(d){  return d[key]; }) )
              allDensity.push({key: key, density: density})
          }

          // Add areas
          const myCurves = svg.selectAll("areas")
            .data(allDensity)
            .join("path")
              .attr("class", "myCurves")
              .attr("transform", function(d){return(`translate(0, ${(yName(d.key)-height)})`)})
              .attr("fill", function(d){
                let grp = d.key ;
                let index = categories.indexOf(grp)
                let value = allMeans[index]
                return myColor( value  )
              })
              .datum(function(d){return(d.density)})
              .attr("opacity", 0.7)
              .attr("stroke", "#000")
              .attr("stroke-width", 0.1)
              .attr("d",  d3.line()
                  .curve(d3.curveBasis)
                  .x(function(d) { return x(0); })
                  .y(function(d) { return y(d[1]); })
              )

          // Animate X axis apparition
          x.range([ 0, width ]);
          xAxis
            .transition()
            .duration(5000)
            .call(d3.axisBottom(x).tickValues([0,25, 50, 75, 100]).tickSize(-height) )
            .select(".domain").remove()

          // Animate densities apparition
          myCurves
            .transition()
            .duration(5000)
            .attr("d",  d3.line()
                .curve(d3.curveBasis)
                .x(function(d) { return x(d[0]); })
                .y(function(d) { return y(d[1]); })
            )

        })

        // This is what I need to compute kernel density estimation
        function kernelDensityEstimator(kernel, X) {
          return function(V) {
            return X.map(function(x) {
              return [x, d3.mean(V, function(v) { return kernel(x - v); })];
            });
          };
        }

        function kernelEpanechnikov(k) {
          return function(v) {
            return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
          };
        }
    }
    
    function renderDonut() {
        d3.select("#donut").select("svg").remove();
        
        // set the dimensions and margins of the graph
        const width = 450,
            height = 450,
            margin = 40;

        // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
        const radius = Math.min(width, height) / 2 - margin

        // append the svg object to the div called 'my_dataviz'
        const svg = d3.select("#donut")
          .append("svg")
            .attr("width", width)
            .attr("height", height)
          .append("g")
            .attr("transform", `translate(${width/2},${height/2})`);

        // Create dummy data
        const data = {1: 9, 2: 20, 3: 30, 4: 8, 5: 12, 6: 3, 7: 7}

        // set the color scale
        const color = d3.scaleSequential()
            .domain([0,30])
            .interpolator(d3.interpolateViridis);

        // Compute the position of each group on the pie:
        const pie = d3.pie()
          .sort(null) // Do not sort group by size
          .value(d => d[1])
        const data_ready = pie(Object.entries(data))

        // The arc generator
        const arc = d3.arc()
          .innerRadius(radius * 0.5)         // This is the size of the donut hole
          .outerRadius(radius * 0.8)

        // Another arc that won't be drawn. Just for labels positioning
        const outerArc = d3.arc()
          .innerRadius(radius * 0.9)
          .outerRadius(radius * 0.9)

        // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
        svg
          .selectAll('allSlices')
          .data(data_ready)
          .join('path')
          .attr('d', arc)
          .attr('fill', d => color(d.data[1]))
          .attr("stroke", "white")
          .style("stroke-width", "2px")
          .style("opacity", 0.7)

        // Add the polylines between chart and labels:
        svg
          .selectAll('allPolylines')
          .data(data_ready)
          .join('polyline')
            .attr("stroke", "white")
            .style("fill", "none")
            .attr("stroke-width", 1)
            .attr('points', function(d) {
              const posA = arc.centroid(d) // line insertion in the slice
              const posB = outerArc.centroid(d) // line break: we use the other arc generator that has been built only for that
              const posC = outerArc.centroid(d); // Label position = almost the same as posB
              const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2 // we need the angle to see if the X position will be at the extreme right or extreme left
              posC[0] = radius * 0.95 * (midangle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
              return [posA, posB, posC]
            })

        // Add the polylines between chart and labels:
        svg
          .selectAll('allLabels')
          .data(data_ready)
          .join('text')
            .text(d => d.data[0])
            .attr("fill", "white")
            .attr('transform', function(d) {
                const pos = outerArc.centroid(d);
                const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                pos[0] = radius * 0.99 * (midangle < Math.PI ? 1 : -1);
                return `translate(${pos})`;
            })
            .style('text-anchor', function(d) {
                const midangle = d.startAngle + (d.endAngle - d.startAngle) / 2
                return (midangle < Math.PI ? 'start' : 'end')
            })   
    }
    
    function renderScatterPlot() {
        d3.select("#scatter-plot").select("svg").remove();
        
        // set the dimensions and margins of the graph
        const margin = {top: 10, right: 30, bottom: 30, left: 60},
                width = 460 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select("#scatter-plot")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        //Read the data
        d3.csv("https://raw.githubusercontent.com/holtzy/data_to_viz/master/Example_dataset/2_TwoNum.csv").then( function(data) {

            // Add X axis
            const x = d3.scaleLinear()
            .domain([0, 4000])
            .range([ 0, width ]);
            svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

            // Add Y axis
            const y = d3.scaleLinear()
            .domain([0, 500000])
            .range([ height, 0]);
            svg.append("g")
            .call(d3.axisLeft(y));

            // Add dots
            svg.append('g')
            .selectAll("dot")
            .data(data)
            .join("circle")
                .attr("cx", function (d) { return x(d.GrLivArea); } )
                .attr("cy", function (d) { return y(d.SalePrice); } )
                .attr("r", 1.5)
                .style("fill", "#69b3a2")

        })
    }
    
    function renderRiverFlowRate(river) {
        d3.select("#river-flow-rate").select("svg").remove();
        
        // set the dimensions and margins of the graph
        const margin = {top: 10, right: 30, bottom: 30, left: 60},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select("#river-flow-rate")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Parse the Data
        d3.csv(`data/${river}.csv`).then(function(data) {
            // X axis
            const x = d3.scaleBand()
              .range([ 0, width ])
              .domain(data.map(d => d.Month))
              .padding(0.2);
            svg.append("g")
              .attr("transform", `translate(0, ${height})`)
              .call(d3.axisBottom(x))
              .selectAll("text")
                .attr("transform", "translate(-10,0)rotate(-45)")
                .style("text-anchor", "end");

            // Add Y axis
            const y = d3.scaleLinear()
              .domain([0, d3.max(data, function(d) { return +d.Volume;})])
              .range([ height, 0]);
            svg.append("g")
              .call(d3.axisLeft(y));

            // Bars
            svg.selectAll("mybar")
              .data(data)
              .join("rect")
                .attr("x", d => x(d.Month))
                .attr("y", d => y(d.Volume))
                .attr("width", x.bandwidth())
                .attr("height", d => height - y(d.Volume))
                .attr("fill", "#69b3a2");
            
            svg.append("text")
                .attr("class", "label")
                .attr("text-anchor", "end")
                .attr("y", 6)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .attr("fill", "#FFCD00")
                .text("");
        });
    }
    
    function renderReservoirLevel(reservePercent) {
        d3.select("#reservoir-level").select("svg").remove();
        
        // set the dimensions and margins of the graph
        const margin = {top: 10, right: 30, bottom: 30, left: 60},
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        const svg = d3.select("#reservoir-level")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        //Read the data
        d3.csv(`data/simulation.csv`).then(function(data) {
            data = data.filter(d => {                
                return (d.Reserve_Percent * 100) === Number(reservePercent);
            });

            // Add X axis -> Timestep
            const x = d3.scaleLinear()
              .range([0, width])
              .domain([0, 200]);
            
            svg.append("g")
              .attr("transform", `translate(0, ${height})`)
              .call(d3.axisBottom(x));

            // Add Y axis -> Reservation Level
            const y = d3.scaleLinear()
              .domain([0, 75000])
              .range([ height, 0 ]);
            
            svg.append("g")
              .call(d3.axisLeft(y));

            // Add the line
            svg.append("path")
              .datum(data)
              .attr("fill", "none")
              .attr("stroke", "steelblue")
              .attr("stroke-width", 1.5)
              .attr("d", d3.line()
                .x(function(d) { return x(d.timestep) })
                .y(function(d) { return y(d.Reservoir_Level) })
                );
            
            svg.append("text")
                .attr("class", "label")
                .attr("text-anchor", "end")
                .attr("x", width)
                .attr("y", height - 6)
                .attr("fill", "#FFCD00")
                .text("timestep");
            
            svg.append("text")
                .attr("class", "label")
                .attr("text-anchor", "end")
                .attr("y", 6)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .attr("fill", "#FFCD00")
                .text("");
        });
    }
    
    setDefaults();
    runSimulation();
});