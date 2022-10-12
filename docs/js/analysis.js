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
    let reserve = '30';
    
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
    }
    
    function setDefaults() {
        reserveSelection.value = reserve;
        allSelection.checked = true;
        reserveSelectionDetails.innerHTML = reserve;
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
                .text("flow rate");
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
                .text("reservoir level");
        });
    }
    
    setDefaults();
});