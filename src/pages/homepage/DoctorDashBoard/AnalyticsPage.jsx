import React from "react";
import Chart from "react-apexcharts";

const AnalyticsPage = () => {
    const ApexChart = Chart.default || Chart;

    // Dummy ApexCharts Data
    const weeklyVisits = {
        series: [
            {
                name: "Patients",
                data: [10, 15, 12, 20, 25, 30, 18],
            },
        ],
        options: {
            chart: { id: "weekly-visits", foreColor: "#fff" },
            xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
            theme: { mode: "light" },
        },
    };

    const revenue = {
        series: [
            {
                name: "Revenue",
                data: [15000, 22000, 18000, 30000, 28000, 32000],
            },
        ],
        options: {
            chart: { id: "revenue-chart", foreColor: "#fff" },
            xaxis: { categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
            theme: { mode: "light" },
        },
    };

    const diseaseDistribution = {
        series: [40, 25, 15, 10, 10],
        options: {
            labels: ["Diabetes", "Hypertension", "Cardiac", "Thyroid", "Other"],
            chart: { type: "donut", foreColor: "#fff" },
            theme: { mode: "light" },
        },
    };

    const ageGroups = {
        series: [15, 20, 25, 30, 10], // Adjusted data to match visual proportions roughly
        options: {
            labels: ["0–18", "19–30", "31–45", "46–60", "60+"],
            chart: {
                type: "polarArea",
                foreColor: "#fff",
                toolbar: { show: false }
            },
            colors: ["#0f5288", "#229f44", "#12808c", "#34d399", "#facc15"], // Colors matching the image
            stroke: {
                colors: ["#fff"]
            },
            fill: {
                opacity: 0.9
            },
            legend: {
                position: 'top',
                horizontalAlign: 'center',
                itemMargin: {
                    horizontal: 10,
                    vertical: 5
                }
            },
            theme: { mode: "light"||"light" },
            plotOptions: {
                polarArea: {
                    rings: {
                        strokeWidth: 1,
                        strokeColor: '#333'
                    },
                    spokes: {
                        strokeWidth: 1,
                        connectorColors: '#333'
                    }
                }
            }
        },
    };

    const performanceMetrics = {
        series: [{
            name: 'Score',
            data: [80, 90, 85, 95, 88],
        }],
        options: {
            chart: {
                height: 350,
                type: 'radar',
                foreColor: '#fff',
                toolbar: { show: false }
            },
            labels: ['Satisfaction', 'Communication', 'Diagnosis', 'Punctuality', 'Follow-up'],
            stroke: {
                width: 2,
                colors: ['#3b82f6']
            },
            fill: {
                opacity: 0.4,
                colors: ['#3b82f6']
            },
            markers: {
                size: 4,
                colors: ['#fff'],
                strokeColors: '#3b82f6',
                strokeWidth: 2,
            },
            yaxis: {
                show: false,
            },
            xaxis: {
                labels: {
                    style: {
                        colors: ["#fff", "#fff", "#fff", "#fff", "#fff"],
                        fontSize: "12px",
                        fontFamily: "Inter, sans-serif"
                    }
                }
            },
            theme: { mode: "light" },
            plotOptions: {
                radar: {
                    polygons: {
                        strokeColors: '#333',
                        connectorColors: '#333',
                        fill: {
                            colors: undefined
                        }
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
