import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminDashboard, getSupportRequests } from "../../api/admin/adminServices";
import { Users, UserPlus, Building2, Stethoscope, ShieldCheck, Headphones, MessageSquare } from "lucide-react";
import Chart from "react-apexcharts";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalHospitals: 0,
    totalAdmins: 0,
    totalHelpDesks: 0,
    recentRegistrations: [],
    activityStats: []
  });
  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // Add hook

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, supportData] = await Promise.all([
          getAdminDashboard(),
          getSupportRequests()
        ]);
        setStats(dashboardData);
        setSupportRequests(supportData);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]); // Add dependency

  const chartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      background: 'transparent'
    },
    colors: ['#3B82F6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: {
      categories: stats.activityStats?.map(item => item._id) || [],
      labels: { style: { colors: 'var(--secondary-color)' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: 'var(--secondary-color)' } }
    },
    grid: {
      borderColor: 'var(--border-color)',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } }
    },
    theme: { mode: 'dark' } // or dynamic based on theme context
  };

  const chartSeries = [{
    name: 'New Users',
    data: stats.activityStats?.map(item => item.count) || []
  }];

  const StatCard = ({ title, value, icon: Icon, color, borderColor, bgColor, textColor }) => (
    <div className={`w-full p-4 rounded-xl border flex items-center justify-between hover:border-${color}-500 transition-all duration-300 shadow-lg group hover:border-opacity-100 ${borderColor}`}
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: 'var(--secondary-color)' }}>{title}</p>
        <h3 className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${bgColor} ${textColor} group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );

  if (loading) return <div className="p-8" style={{ color: 'var(--text-color)' }}>Loading stats...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl max-[600px]:text-xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--secondary-color)' }}>Welcome back, Super Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="blue" borderColor="hover:border-blue-500" bgColor="bg-blue-500/10" textColor="text-blue-400" />
        <StatCard title="Total Doctors" value={stats.totalDoctors} icon={Stethoscope} color="green" borderColor="hover:border-green-500" bgColor="bg-green-500/10" textColor="text-green-400" />
        <StatCard title="Total Patients" value={stats.totalPatients} icon={UserPlus} color="purple" borderColor="hover:border-purple-500" bgColor="bg-purple-500/10" textColor="text-purple-400" />
        <StatCard title="Total Hospitals" value={stats.totalHospitals} icon={Building2} color="orange" borderColor="hover:border-orange-500" bgColor="bg-orange-500/10" textColor="text-orange-400" />
        <StatCard title="Total Admins" value={stats.totalAdmins} icon={ShieldCheck} color="red" borderColor="hover:border-red-500" bgColor="bg-red-500/10" textColor="text-red-400" />
        <StatCard title="Total Front Desk" value={stats.totalHelpDesks} icon={Headphones} color="yellow" borderColor="hover:border-yellow-500" bgColor="bg-yellow-500/10" textColor="text-yellow-400" />
      </div>

      {/* Activity Chart & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

        {/* Activity Chart */}
        <div className="p-6 rounded-xl border shadow-lg"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>User Activity (Last 7 Days)</h3>
          <Chart options={chartOptions} series={chartSeries} type="area" height={250} />
        </div>

        {/* Recent Registrations */}
        <div className="p-6 rounded-xl border shadow-lg overflow-hidden"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Recent Registrations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="py-2 text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>Name</th>
                  <th className="py-2 text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>Role</th>
                  <th className="py-2 text-sm font-medium" style={{ color: 'var(--secondary-color)' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRegistrations?.map((user) => (
                  <tr key={user._id} className="border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="py-3 text-sm" style={{ color: 'var(--text-color)' }}>{user.name}</td>
                    <td className="py-3 text-sm capitalize" style={{ color: 'var(--text-color)' }}>{user.role}</td>
                    <td className="py-3 text-sm" style={{ color: 'var(--secondary-color)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {(!stats.recentRegistrations || stats.recentRegistrations.length === 0) && (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-sm" style={{ color: 'var(--secondary-color)' }}>No recent registrations</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


    </div>
  );
};

export default AdminDashboard;