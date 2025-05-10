// script.js

console.log("✅ script.js loaded");

d3.csv("data/spotifytoptracks_clean_top10.csv", d3.autoType)
  .then(data => {
    console.log("📊 data loaded:", data);

    // 1) Friendly labels, now with units
    const metrics = {
      tempo:        "Tempo (BPM)",
      loudness:     "Loudness (dB)",
      acousticness: "Acousticness",
      speechiness:  "Speechiness",
      valence:      "Valence"
    };

    const select = d3.select("#metric-select");

    const tooltip = d3.select("body")
      .append("div")
        .attr("class","tooltip")
        .style("position","absolute")
        .style("pointer-events","none")
        .style("opacity",0);

    function drawChart(valueKey) {
      // clear previous chart
      d3.select("#chart").html("");

      const margin = { top: 80, right: 20, bottom: 100, left: 70 };
      const width  = 800 - margin.left - margin.right;
      const height = 500 - margin.top  - margin.bottom;

      const svg = d3.select("#chart")
        .append("svg")
          .attr("width",  width + margin.left + margin.right)
          .attr("height", height + margin.top  + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

      // Title
      svg.append("text")
        .attr("x", width/2)
        .attr("y", -margin.top/2)
        .attr("text-anchor","middle")
        .attr("font-size","18px")
        .attr("font-weight","600")
        .text(`Top 10 Spotify Tracks of 2020 by ${metrics[valueKey]}`);

      // Scales
      const x = d3.scaleBand()
        .domain(data.map(d => d.track_name))
        .range([0, width]).padding(0.1);

      const yDomain = valueKey === "loudness"
        ? d3.extent(data, d => d[valueKey])
        : [0, d3.max(data, d => d[valueKey])];

      const y = d3.scaleLinear()
        .domain(yDomain).nice()
        .range([height, 0]);

      // Y-axis label
      svg.append("text")
        .attr("transform","rotate(-90)")
        .attr("x",-height/2)
        .attr("y",-margin.left+20)
        .attr("text-anchor","middle")
        .attr("font-size","14px")
        .text(metrics[valueKey]);

      // Axes
      svg.append("g")
        .attr("class","x-axis")
        .attr("transform",`translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
          .attr("text-anchor","end")
          .attr("transform","rotate(-40)")
          .attr("dx","-0.6em")
          .attr("dy","0.4em");

      svg.append("g")
        .attr("class","y-axis")
        .call(d3.axisLeft(y));

      // Bars with transition & enhanced tooltip
      svg.selectAll("rect")
        .data(data)
        .join("rect")
          .attr("x",     d => x(d.track_name))
          .attr("width", x.bandwidth())
          .attr("fill",  "#3A6E4C")
        .on("mouseover",(event,d) => {
          // format the numeric display
          let display = d[valueKey];
          if (valueKey === "tempo") {
            display = display.toFixed(1) + " BPM";
          } else if (valueKey === "loudness") {
            display = display.toFixed(1) + " dB";
          } else if (["acousticness","speechiness","valence"].includes(valueKey)) {
            display = (display * 100).toFixed(1) + "%";
          }

          // show full info
          tooltip
            .style("opacity",1)
            .html(`
              <strong>${d.track_name}</strong><br/>
              Artist: ${d.artist}<br/>
              Genre: ${d.genre}<br/>
              ${metrics[valueKey]}: ${display}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top",  (event.pageY - 28) + "px");
        })
        .on("mouseout",() => tooltip.style("opacity",0))
        .transition()
          .duration(800)
          .attr("y",      d => y(d[valueKey]))
          .attr("height", d => height - y(d[valueKey]));

      // 8) Data source caption
      d3.select("#chart")
        .append("p")
          .attr("class","data-source")
          .style("text-align","center")
          .style("font-size","12px")
          .style("color","#666")
          .style("margin","8px 0 0")
          .html(`
            Data Source:
            <a href="https://www.kaggle.com/datasets/atillacolak/top-50-spotify-tracks-2020?resource=download"
               target="_blank" rel="noopener noreferrer">
              Spotify Top Tracks of 2020 (Kaggle)
            </a>
          `);
    }

    // initial draw & on-change
    drawChart(select.property("value"));
    select.on("change", function() { drawChart(this.value); });
  })
  .catch(err => console.error("❌ CSV load error:", err));