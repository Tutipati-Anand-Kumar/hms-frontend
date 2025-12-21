import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";

const AnalyticsPage = () => {
    const ApexChart = Chart.default || Chart;

    const [isDark, setIsDark] = useState(
        document.documentElement.getAttribute("data-theme") === "dark" ||
        localStorage.getItem("theme") === "dark"
    );

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
        };

        window.addEventListener("themeChange", handleThemeChange);
        return () => window.removeEventListener("themeChange", handleThemeChange);
    }, []);

    const chartTextColor = isDark ? "#94a3b8" : "#64748b"; // slate-400 : slate-500
    const chartMode = isDark ? "dark" : "light";
    const gridColor = isDark ? "#334155" : "#e2e8f0"; // slate-700 : slate-200

    // Dummy ApexCharts Data
    const weeklyVisits = {
        series: [{ name: "Patients", data: [10, 15, 12, 20, 25, 30, 18] }],
        options: {
            chart: {
                id: "weekly-visits",
                foreColor: chartTextColor,
                toolbar: { show: false }
            },
            xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
            theme: { mode: chartMode },
            grid: { borderColor: gridColor },
            stroke: { curve: 'smooth', width: 3 }
        },
    };

    const revenue = {
        series: [{ name: "Revenue", data: [15000, 22000, 18000, 30000, 28000, 32000] }],
        options: {
            chart: {
                id: "revenue-chart",
                foreColor: chartTextColor,
                toolbar: { show: false }
            },
            xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
            theme: { mode: chartMode },
            grid: { borderColor: gridColor },
            colors: ["#3b82f6"]
        },
    };

    const diseaseDistribution = {
        series: [40, 25, 15, 10, 10],
        options: {
            labels: ["Diabetes", "Hypertension", "Cardiac", "Thyroid", "Other"],
            chart: { type: "donut", foreColor: chartTextColor },
            theme: { mode: chartMode },
            stroke: { colors: [isDark ? "#1e293b" : "#fff"] },
            legend: { position: 'bottom', labels: { colors: chartTextColor } }
        },
    };

    const ageGroups = {
        series: [15, 20, 25, 30, 10],
        options: {
            labels: ["0–18", "19–30", "31–45", "46–60", "60+"],
            chart: {
                type: "polarArea",
                foreColor: chartTextColor,
                toolbar: { show: false }
            },
            colors: ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ef4444"],
            stroke: { colors: [isDark ? "#1e293b" : "#fff"] },
            fill: { opacity: 0.8 },
            legend: { position: 'bottom', labels: { colors: chartTextColor } },
            theme: { mode: chartMode },
            plotOptions: {
                polarArea: {
                    rings: { strokeWidth: 1, strokeColor: gridColor },
                    spokes: { strokeWidth: 1, connectorColors: gridColor }
                }
            }
        },
    };

    const performanceMetrics = {
        series: [{ name: 'Score', data: [80, 90, 85, 95, 88] }],
        options: {
            chart: {
                height: 350,
                type: 'radar',
                foreColor: chartTextColor,
                toolbar: { show: false }
            },
            labels: ['Satisfaction', 'Communication', 'Diagnosis', 'Punctuality', 'Follow-up'],
            stroke: { width: 2, colors: ['#3b82f6'] },
            fill: { opacity: 0.4, colors: ['#3b82f6'] },
            markers: { size: 4, colors: [isDark ? '#1e293b' : '#fff'], strokeColors: '#3b82f6', strokeWidth: 2 },
            yaxis: { show: false },
            xaxis: {
                labels: {
                    style: {
                        colors: Array(5).fill(chartTextColor),
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif"
                    }
                }
            },
            theme: { mode: chartMode },
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors: gridColor,
                        connectorColors: gridColor,
                        fill: { colors: undefined }
                    }
                }
            }
        },
    };

    return (
        <div className="min-h-screen " style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>

            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>Analytics & Performance</h2>


            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Today's Patients</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>18</p>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Total Patients</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>1340</p>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Avg Consult Time</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>9 min</p>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <p className="text-sm" style={{ color: 'var(--secondary-color)' }}>Queue Pending</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-color)' }}>4</p>
                </div>
            </div>




            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Weekly Patient Visits */}
                <div className="p-4 rounded-xl shadow" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Weekly Patient Visits</h3>
                    <ApexChart
                        options={weeklyVisits.options}
                        series={weeklyVisits.series}
                        type="line"
                        height={300}
                    />
                </div>

                {/* Revenue Chart */}
                <div className="p-4 rounded-xl shadow" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Monthly Revenue</h3>
                    <ApexChart
                        options={revenue.options}
                        series={revenue.series}
                        type="bar"
                        height={300}
                    />
                </div>

                {/* Disease Distribution */}
                <div className="p-4 rounded-xl shadow" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Disease Distribution</h3>
                    <ApexChart
                        options={diseaseDistribution.options}
                        series={diseaseDistribution.series}
                        type="donut"
                        height={300}
                    />
                </div>

                {/* Patient Age Groups */}
                <div className="p-4 rounded-xl shadow" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Patient Age Groups</h3>
                    <ApexChart
                        options={ageGroups.options}
                        series={ageGroups.series}
                        type="polarArea"
                        height={350}
                    />
                </div>

            </div>

            {/* Performance Metrics */}
            <div className="p-4 rounded-xl shadow" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--text-color)' }}>Performance Metrics</h3>
                <ApexChart
                    options={performanceMetrics.options}
                    series={performanceMetrics.series}
                    type="radar"
                    height={350}
                />
            </div>
        </div>
    );
};

export default AnalyticsPage;
