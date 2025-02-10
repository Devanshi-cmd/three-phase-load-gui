const socket = io();

let voltageChart, currentChart, powerChart; // Store chart instances

function sendData() {
    const data = {
        R_vals: {
            red: parseFloat(document.getElementById("R_red").value) || 0,
            blue: parseFloat(document.getElementById("R_blue").value) || 0,
            green: parseFloat(document.getElementById("R_green").value) || 0
        },
        L_vals: {
            red: parseFloat(document.getElementById("L_red").value) || 0,
            blue: parseFloat(document.getElementById("L_blue").value) || 0,
            green: parseFloat(document.getElementById("L_green").value) || 0
        },
        C_vals: {
            red: parseFloat(document.getElementById("C_red").value) || 0,
            blue: parseFloat(document.getElementById("C_blue").value) || 0,
            green: parseFloat(document.getElementById("C_green").value) || 0
        },
        omega: parseFloat(document.getElementById("omega").value) || 0
    };

    console.log("Sending Data:", data);
    socket.emit("calculate", data);
}

socket.on("results", (data) => {
    console.log("Received Results:", data);

    voltageChart = updateChart("voltageChart", data.time, data.voltage, "Voltage (V)", voltageChart);
    currentChart = updateChart("currentChart", data.time, data.current, "Current (A)", currentChart);
    powerChart = updateChart("powerChart", data.time, data.power.active, "Active Power (W)", powerChart); // ✅ Store updated instance

    let impedanceHTML = "<h3>Impedance Values</h3>";
    Object.keys(data.impedance).forEach(color => {
        const { magnitude, angle } = data.impedance[color];
        impedanceHTML += `<p>${color} phase: |Z| = ${magnitude.toFixed(2)} Ω, θ = ${angle.toFixed(2)} rad</p>`;
    });

    document.getElementById("impedanceResults").innerHTML = impedanceHTML;
});


function updateChart(canvasId, time, dataset, label, chartInstance) {
    const ctx = document.getElementById(canvasId).getContext("2d");

    if (chartInstance) {
        chartInstance.destroy(); // Destroy old chart before creating a new one
    }

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: time,
            datasets: Object.keys(dataset).map((key, index) => ({
                label: `${label} - ${key}`,
                data: dataset[key],
                borderColor: ["red", "green", "blue"][index],
                fill: false
            }))
        },
        options: { responsive: true }
    });

    return chartInstance; // Return the new chart instance
}
