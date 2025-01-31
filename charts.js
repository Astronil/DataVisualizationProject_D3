// Define file paths for the CSV data
const csvFile1 = "top_100_youtubers.csv";
const csvFile2 = "avg_view_every_year.csv";

document.addEventListener("DOMContentLoaded", () => {
  // Load data from both CSV files using D3's CSV loading utility
  Promise.all([d3.csv(csvFile1), d3.csv(csvFile2)])
    .then(([youtubersData, yearlyData]) => {
      // Check if data is loaded
      if (!youtubersData || youtubersData.length === 0) {
        throw new Error("No data found in top_100_youtubers.csv");
      }
      if (!yearlyData || yearlyData.length === 0) {
        throw new Error("No data found in avg_view_every_year.csv");
      }

      // Parse numerical values in data
      youtubersData.forEach((d) => {
        d.subscribers = +d.subscribers;
        d.likes = +d.likes;
        d.followers = +d.followers;
        d.views = +d.views;
        d.income_quarterly = +d.income_quarterly;
      });

      yearlyData.forEach((d) => {
        d.year = +d.year;
        d.average_views = +d.average_views;
      });

      // Debug: Log loaded data for validation
      console.log("YouTubers Data:", youtubersData);
      console.log("Yearly Data:", yearlyData);

      // Render charts with validated data
      renderCategoryProportionChart(youtubersData);
      renderLikesVsSubscribersChart(youtubersData);
      renderYouTubersByCountryChart(youtubersData);
      renderAverageYearlyViewsChart(yearlyData);
      renderQuarterlyIncomeChart(youtubersData);
      renderCategoryByCountryChart(youtubersData);
      renderMostFollowersCategoryChart(youtubersData);
      renderCountryWithMostYouTubersChart(youtubersData);
      renderChannelWithMostSubscribersChart(youtubersData);
    })
    .catch((error) => {
      console.error("Error loading CSV files:", error.message);
    });
});

// Chart 1: Proportion of the Top 100 YouTube Channels in Each Category
// Chart 1: Proportion of the Top 100 YouTube Channels in Each Category
function renderCategoryProportionChart(data) {
  const categoryKey = "Category"; // Key for category in the dataset

  const width = 1400,
    height = 1000,
    radius = Math.min(width, height - 200) / 2;

  const svg = d3
    .select("#chart1")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Handle missing categories
  data.forEach((d) => {
    d[categoryKey] = d[categoryKey] || "Unknown";
  });

  // Group and count data by category
  const categoryData = d3
    .rollups(
      data,
      (v) => v.length,
      (d) => d[categoryKey]
    )
    .map(([key, value]) => ({ category: key, count: value }));

  const pie = d3.pie().value((d) => d.count);
  const arc = d3.arc().innerRadius(0).outerRadius(radius);
  const outerArc = d3
    .arc()
    .innerRadius(radius + 10)
    .outerRadius(radius + 10);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Create tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("text-align", "center")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("opacity", 0);

  // Draw the pie slices
  svg
    .selectAll("path")
    .data(pie(categoryData))
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => color(d.data.category))
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr(
          "d",
          d3
            .arc()
            .innerRadius(0)
            .outerRadius(radius + 10)
        ); // Expand slice
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`<strong>${d.data.category}</strong>: ${d.data.count}`)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).transition().duration(200).attr("d", arc); // Reset slice size
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Add category labels
  svg
    .selectAll("polyline")
    .data(pie(categoryData))
    .enter()
    .append("polyline")
    .attr("points", (d) => {
      const pos = outerArc.centroid(d);
      pos[0] = radius * (midAngle(d) < Math.PI ? 1 : -1); // Align labels to left/right
      return [arc.centroid(d), outerArc.centroid(d), pos];
    })
    .style("fill", "none")
    .style("stroke", "#ccc")
    .style("stroke-width", "1px");

  svg
    .selectAll("text")
    .data(pie(categoryData))
    .enter()
    .append("text")
    .attr("transform", (d) => {
      const pos = outerArc.centroid(d);
      pos[0] = radius * (midAngle(d) < Math.PI ? 1.1 : -1.1);
      return `translate(${pos})`;
    })
    .attr("text-anchor", (d) => (midAngle(d) < Math.PI ? "start" : "end"))
    .style("font-size", "12px")
    .text((d) => `${d.data.category} (${d.data.count})`);

  // Add legends
  const legend = svg
    .append("g")
    .attr("transform", `translate(-${width / 2 - 20}, -${height / 2})`);

  legend
    .selectAll("rect")
    .data(categoryData)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", (d) => color(d.category));

  legend
    .selectAll("text")
    .data(categoryData)
    .enter()
    .append("text")
    .attr("x", 20)
    .attr("y", (d, i) => i * 20 + 12)
    .style("font-size", "12px")
    .text((d) => `${d.category}`);

  // Utility function for label positioning
  function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }
}

function renderLikesVsFollowersChart(data) {
  const width = 600,
    height = 450,
    margin = { top: 30, right: 30, bottom: 60, left: 70 };

  const svg = d3
    .select("#chart2")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xMax = d3.max(data, (d) => d.followers) || 1;
  const yMax = d3.max(data, (d) => d.Likes) || 1;

  // Define the scales
  const x = d3
    .scaleLog()
    .domain([10, xMax]) // Start x-axis from 10 for log scale
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLog()
    .domain([10, yMax]) // Start y-axis from 10 for log scale
    .range([height - margin.bottom, margin.top]);

  // Create X-axis
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(
      d3.axisBottom(x).ticks(10, ",") // Format tick labels
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", width / 2)
        .attr("y", 50)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Followers")
    );

  // Create Y-axis
  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(
      d3.axisLeft(y).ticks(10, ",") // Format tick labels
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("transform", "rotate(-90)")
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Likes")
    );

  // Create tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("text-align", "center")
    .style("padding", "8px")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 4px 8px rgba(0,0,0,0.3)")
    .style("opacity", 0);

  // Create circles (data points)
  svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.followers))
    .attr("cy", (d) => y(d.Likes))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 8) // Enlarge the circle
        .attr("fill", "darkblue");

      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `<strong>Subscribers:</strong> ${d3.format(",")(
            d.followers
          )}<br><strong>Likes:</strong> ${d3.format(",")(d.Likes)}`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function () {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 5) // Reset circle size
        .attr("fill", "steelblue");

      tooltip.transition().duration(500).style("opacity", 0);
    });
}

// Fetch CSV data
d3.csv("top_100_youtubers.csv")
  .then(function (data) {
    const parsedData = data.map((d) => ({
      followers: +d.followers, // Parse followers as a number
      Likes: +d.Likes, // Parse likes as a number
    }));

    renderLikesVsFollowersChart(parsedData);
  })
  .catch(function (error) {
    console.error("Error loading or parsing the CSV file:", error);
  });

function renderYouTubersByCountryChart(data) {
  // Group the data by country and count the number of YouTubers per country
  const grouped = d3
    .rollups(
      data,
      (v) => v.length,
      (d) => d.Country
    )
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  // Take the top 15 countries to focus the chart (or adjust this as needed)
  const topCountries = grouped.slice(0, 15);

  // Define SVG dimensions
  const svgWidth = 800;
  const svgHeight = 500;
  const margin = { top: 50, right: 20, bottom: 100, left: 100 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  // Create SVG container
  const svg = d3
    .select("#chart3")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Define the x and y scales
  const x = d3
    .scaleBand()
    .domain(topCountries.map((d) => d.country))
    .range([0, width])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(topCountries, (d) => d.count) * 1.1]) // Add padding for better visualization
    .range([height, 0]);

  // Add horizontal gridlines
  chartArea
    .append("g")
    .attr("class", "grid")
    .call(
      d3.axisLeft(y).tickSize(-width).tickFormat("") // Remove the tick labels for the gridlines
    )
    .style("stroke", "#e0e0e0")
    .style("opacity", 0.7);

  // Create tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("text-align", "center")
    .style("padding", "10px")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 4px 8px rgba(0,0,0,0.3)")
    .style("opacity", 0);

  // Add bars with transitions
  chartArea
    .selectAll("rect")
    .data(topCountries)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.country))
    .attr("y", y(0))
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", "steelblue")
    .attr("rx", 5)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("fill", "darkblue");
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>Country:</strong> ${d.country}<br><strong>YouTubers:</strong> ${d.count}`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 28}px`);
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", "steelblue");
      tooltip.style("opacity", 0);
    })
    .transition()
    .duration(1000)
    .attr("y", (d) => y(d.count))
    .attr("height", (d) => height - y(d.count));

  // Add the x-axis
  chartArea
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .style("font-size", "12px")
    .attr("transform", "rotate(-45)");

  // Add the y-axis
  chartArea.append("g").call(d3.axisLeft(y).ticks(6));

  // Add labels
  svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", svgHeight - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Country");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -svgHeight / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Number of YouTubers");

  svg
    .append("text")
    .attr("x", svgWidth / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Top 15 Countries by Number of YouTubers");
}

// Fetch CSV data
d3.csv("top_100_youtubers.csv")
  .then(function (data) {
    const parsedData = data.map((d) => ({
      Country: d.Country,
    }));
    renderYouTubersByCountryChart(parsedData);
  })
  .catch(function (error) {
    console.error("Error loading or parsing the CSV file:", error);
  });

function renderAverageYearlyViewsChart(data) {
  if (!data || data.length === 0) {
    console.error("No data available for Average Yearly Views chart");
    return;
  }

  // Define the channels and their respective colors
  const channels = [
    "T-Series",
    "ABCkidTV - Nursery Rhymes",
    "SET India",
    "PewDiePie",
    "MrBeast",
  ];
  const channelColors = {
    "T-Series": "steelblue",
    "ABCkidTV - Nursery Rhymes": "orange",
    "SET India": "green",
    PewDiePie: "red",
    MrBeast: "purple",
  };

  // Create SVG container
  const svgWidth = 800;
  const svgHeight = 500;
  const margin = { top: 50, right: 150, bottom: 50, left: 100 };
  const width = svgWidth - margin.left - margin.right;
  const height = svgHeight - margin.top - margin.bottom;

  const svg = d3
    .select("#chart4")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Define scales
  const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.Year))
    .range([0, width])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(data, (d) =>
        channels.reduce((sum, channel) => sum + +d[channel], 0)
      ),
    ])
    .range([height, 0]);

  // Add axes
  chartArea
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  chartArea.append("g").call(d3.axisLeft(yScale));

  // Add tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "white")
    .style("padding", "8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("opacity", 0)
    .style("pointer-events", "none");

  // Add stacked bars
  const bars = chartArea
    .selectAll(".bar-group")
    .data(data)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${xScale(d.Year)}, 0)`);

  bars
    .selectAll("rect")
    .data((d) => {
      let cumulativeHeight = 0;
      return channels.map((channel) => {
        const value = +d[channel];
        const segment = {
          year: d.Year,
          channel,
          value,
          yStart: cumulativeHeight,
          yEnd: cumulativeHeight + value,
        };
        cumulativeHeight += value; // Stack segments
        return segment;
      });
    })
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d) => yScale(d.yEnd))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => yScale(d.yStart) - yScale(d.yEnd))
    .attr("fill", (d) => channelColors[d.channel])
    .on("mouseover", function (event, d) {
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>Year:</strong> ${d.year}<br>
             <strong>Channel:</strong> ${d.channel}<br>
             <strong>Views:</strong> ${d.value.toLocaleString()}`
        )
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
      d3.select(this).attr("stroke", "black").attr("stroke-width", 2); // Highlight the segment
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", function () {
      tooltip.style("opacity", 0);
      d3.select(this).attr("stroke", "none"); // Remove highlight
    });

  // Add legends
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width + margin.left - 14}, ${margin.top})`);

  channels.forEach((channel, i) => {
    const legendItem = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendItem
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", channelColors[channel]);

    legendItem
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "12px")
      .text(channel);
  });

  // Add axis labels
  svg
    .append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", svgHeight - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Year");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -svgHeight / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Total Views");
}

// Load CSV data
d3.csv("avg_view_every_year.csv")
  .then(function (data) {
    const parsedData = data.map((d) => ({
      Year: d.Year,
      "T-Series": +d["T-Series"],
      "ABCkidTV - Nursery Rhymes": +d["ABCkidTV - Nursery Rhymes"],
      "SET India": +d["SET India"],
      PewDiePie: +d["PewDiePie"],
      MrBeast: +d["MrBeast"],
    }));

    renderAverageYearlyViewsChart(parsedData);
  })
  .catch(function (error) {
    console.error("Error loading or parsing the CSV file:", error);
  });

function renderQuarterlyIncomeChart(data) {
  // Calculate total income for each channel by summing up the earnings across all four quarters
  data.forEach((d) => {
    d.TotalIncome =
      d["Income q1"] + d["Income q2"] + d["Income q3"] + d["Income q4"];
  });

  // Sort by total income in descending order and take the top 5 channels
  const top5 = data.sort((a, b) => b.TotalIncome - a.TotalIncome).slice(0, 5);

  const width = 800,
    height = 400,
    margin = { top: 20, right: 40, bottom: 70, left: 100 };
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  // Define colors for each quarter
  const colors = d3.scaleOrdinal(d3.schemeCategory10).domain(quarters);

  const svg = d3
    .select("#chart5")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Set up the x and y scales
  const x = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(top5, (d) =>
        d3.max(quarters.map((q) => d[`Income ${q.toLowerCase()}`]))
      ),
    ])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleBand()
    .domain(top5.map((d) => d.ChannelName))
    .range([margin.top, height - margin.bottom])
    .padding(0.1);

  // Add the x-axis (bottom)
  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  // Add the y-axis (left)
  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  // Tooltip setup
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(0, 0, 0, 0.75)")
    .style("color", "#fff")
    .style("padding", "5px")
    .style("border-radius", "4px")
    .style("font-size", "12px");

  // Draw the bars for each channel's quarterly income
  top5.forEach((channel, i) => {
    quarters.forEach((quarter, idx) => {
      svg
        .append("rect")
        .attr("x", x(0)) // Set x to 0 initially
        .attr("y", y(channel.ChannelName) + idx * (y.bandwidth() / 4)) // Stagger the bars vertically within the same channel
        .attr(
          "width",
          x(channel[`Income ${quarter.toLowerCase()}`]) - margin.left
        ) // Set the width based on the income
        .attr("height", y.bandwidth() / 4) // Set the height of each quarter bar
        .attr("fill", colors(quarter)) // Set color for each quarter based on the index
        .on("mouseover", function (event, d) {
          tooltip
            .style("visibility", "visible")
            .text(
              `${channel.ChannelName} - ${quarter}: $${
                channel[`Income ${quarter.toLowerCase()}`]
              }`
            );
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", event.pageY + 5 + "px")
            .style("left", event.pageX + 5 + "px");
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
        });
    });
  });

  // Add a title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .style("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Top 5 YouTube Channels' Quarterly Income");

  // Add legend for quarters
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - 50}, ${margin.top})`);

  quarters.forEach((quarter, i) => {
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", i * 20)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colors(quarter));

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", i * 20 + 12)
      .style("font-size", "12px")
      .text(quarter);
  });
}

// Load the CSV file
d3.csv("top_100_youtubers.csv")
  .then(function (data) {
    // Process the data
    const processedData = data.map((d) => ({
      ChannelName: d.ChannelName,
      "Income q1": +d["Income q1"],
      "Income q2": +d["Income q2"],
      "Income q3": +d["Income q3"],
      "Income q4": +d["Income q4"],
    }));

    renderQuarterlyIncomeChart(processedData);
  })
  .catch(function (error) {
    console.error("Error loading or parsing the CSV file:", error);
  });
function renderCategoryByCountryChart(data) {
  const defaultCountry = "IN";
  const width = 600,
    height = 400,
    margin = { top: 20, right: 20, bottom: 50, left: 50 };

  const svg = d3
    .select("#chart6")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Tooltip container
  const tooltip = d3
    .select("#chart6")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background-color", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("pointer-events", "none");

  // Function to update the chart based on the selected country
  const updateChart = (country) => {
    const filteredData = data.filter((d) => d.Country === country); // Filter by country
    const categories = d3.rollups(
      filteredData,
      (v) => v.length, // Count the number of channels in each category
      (d) => d.Category // Group by category
    );

    // Set up x and y scales
    const x = d3
      .scaleBand()
      .domain(categories.map((d) => d[0])) // Set domain to the categories
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(categories, (d) => d[1])]) // Set the y-axis to the max channel count in the category
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg.selectAll("*").remove(); // Clear the previous chart

    // Add X Axis
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("font-size", "12px");

    // Add Y Axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

    // Draw the bars
    svg
      .selectAll("rect")
      .data(categories)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d[0]))
      .attr("y", (d) => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - margin.bottom - y(d[1]))
      .attr("fill", "steelblue")
      // Add mouseover events for the tooltip
      .on("mouseover", function (event, d) {
        tooltip
          .style("visibility", "visible")
          .html(`Category: ${d[0]}<br/>Channels: ${d[1]}`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("top", event.pageY + 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    // Add chart title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`YouTube Channels by Category - Country: ${country}`);
  };

  updateChart(defaultCountry); // Initialize with the default country

  // Add input field for country selection
  d3.select("#chart6")
    .append("input")
    .attr("type", "text")
    .attr("placeholder", "Enter country code (e.g., IN)")
    .on("input", function () {
      updateChart(this.value || defaultCountry); // Update chart on input
    });
}

// Load the CSV file and process the data
d3.csv("top_100_youtubers.csv")
  .then(function (data) {
    // Ensure that the columns are correctly parsed
    const processedData = data.map((d) => ({
      Country: d.Country,
      Category: d.Category,
    }));

    // Render the chart with the processed data
    renderCategoryByCountryChart(processedData);
  })
  .catch(function (error) {
    console.error("Error loading or parsing the CSV file:", error);
  });

// Chart 7: The Category with the Most Followers
function renderMostFollowersCategoryChart(data) {
  // Sum the followers by category
  const categoryFollowers = d3.rollups(
    data,
    (v) => d3.sum(v, (d) => d.followers), // Sum followers for each category
    (d) => d.Category // Group by category
  );

  // Find the category with the most followers
  const maxCategory = categoryFollowers.reduce((a, b) => (a[1] > b[1] ? a : b));

  // Display the result
  d3.select("#chart7").text(
    `Category with the Most Subscribers: ${maxCategory[0]} (${maxCategory[1]} Subscribers)`
  );
}

// Chart 8: The Country with the Most YouTubers
function renderCountryWithMostYouTubersChart(data) {
  // Count the number of YouTubers by country
  const countryYouTubers = d3.rollups(
    data,
    (v) => v.length, // Count the number of entries (YouTubers) per country
    (d) => d.Country // Group by country
  );

  // Find the country with the most YouTubers
  const maxCountry = countryYouTubers.reduce((a, b) => (a[1] > b[1] ? a : b));

  // Display the result
  d3.select("#chart8").text(
    `Country with the Most YouTubers: ${maxCountry[0]} (${maxCountry[1]} YouTubers)`
  );
}

// Chart 9: The Channel with the Most Subscribers
function renderChannelWithMostSubscribersChart(data) {
  // Find the channel with the most followers (since no 'subscribers' column exists)
  const maxSubscribers = data.reduce((a, b) =>
    a.followers > b.followers ? a : b
  );

  // Display the channel with the most followers (treated as most subscribers)
  d3.select("#chart9").text(
    `Channel with the Most Subscribers: ${maxSubscribers.ChannelName} (${maxSubscribers.followers} Subscribers)`
  );
}

// Load the CSV file and process the data
d3.csv("top_100_youtubers.csv")
  .then(function (data) {
    // Ensure the required fields are properly parsed
    data.forEach((d) => {
      d.followers = +d.followers; // Convert followers to numeric
      // d.subscribers = +d.subscribers; // If subscribers column exists, you can convert it
      d.Category = d.Category.trim(); // Ensure category has no extra spaces
      d.Country = d.Country.trim(); // Ensure country has no extra spaces
      d.ChannelName = d.ChannelName.trim(); // Ensure channel name is trimmed
    });

    // Render the charts
    renderMostFollowersCategoryChart(data); // Chart 7
    renderCountryWithMostYouTubersChart(data); // Chart 8
    renderChannelWithMostSubscribersChart(data); // Chart 9
  })
  .catch(function (error) {
    console.error("Error loading or parsing the CSV file:", error);
  });
