const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const math = require("mathjs");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("calculate", (data) => {
        console.log("Received Data:", data); // Debugging Line
        console.log("R_vals:", data.R_vals);
        console.log("L_vals:", data.L_vals);
        console.log("C_vals:", data.C_vals);
    
        if (!data.R_vals || !data.L_vals || !data.C_vals) {
            console.error("Invalid data format received!");
            return;
        }
    
        const results = calculateLoad(data.R_vals, data.L_vals, data.C_vals, data.omega);
        socket.emit("results", results);
    });
    

    socket.on("disconnect", () => console.log("Client disconnected"));
});

function calculateLoad(R_vals, L_vals, C_vals, omega) {
    const t = math.range(0, 2 * (2 * Math.PI) / omega, 0.001).toArray();
    const V_m = 230 * Math.sqrt(2); // Peak voltage
    const phases = [0, -2 * Math.PI / 3, 2 * Math.PI / 3];
    const colors = ["red", "blue", "green"];

    let results = {
        time: t,
        voltage: {},
        current: {},
        impedance: {},
        power: { active: {}, reactive: {}, apparent: {}, instantaneous: {} }
    };

    colors.forEach((color, i) => {
        const phase = phases[i];
        const R = R_vals[color];
        const L = L_vals[color];
        const C = C_vals[color];

        results.voltage[color] = t.map(t => V_m * Math.sin(omega * t + phase));

        const Z = math.complex(R, omega * L - 1 / (omega * C));
        results.impedance[color] = { magnitude: math.abs(Z), angle: math.arg(Z) };

        const I_m = V_m / math.abs(Z);
        const theta = math.arg(Z);

        results.current[color] = t.map(t => I_m * Math.sin(omega * t + phase - theta));

        // Compute power
        results.power.active[color] = t.map(
            (time, idx) => results.voltage[color][idx] * results.current[color][idx]
        );
        
        results.power.reactive[color] = V_m * I_m * Math.sin(theta);
        results.power.apparent[color] = V_m * I_m;
        results.power.instantaneous[color] = t.map(
            (time, idx) => results.voltage[color][idx] * results.current[color][idx]
        );
    });

    return results;
}


const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
