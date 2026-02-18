import { useQuery } from '@tanstack/react-query';
import { useRedisStore } from '@/store/use-redis-store';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar
} from 'recharts';
import { Activity, Users, HardDrive, Cpu, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

// Types for our stats
interface RedisStats {
  info: any;
  clients: any[];
  commandStats: any[];
}

export function ServerStats() {
  const { currentConnection } = useRedisStore();
  const [history, setHistory] = useState<any[]>([]);

  const { data: stats, isLoading, error } = useQuery<RedisStats>({
    queryKey: ['redis-stats', currentConnection?.id],
    queryFn: async () => {
      if (!currentConnection) throw new Error('No connection');
      const res = await fetch('/api/redis/stats', {
        headers: { 'x-connection-id': currentConnection.id }
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!currentConnection,
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Update history for charts
  useEffect(() => {
    if (stats?.info) {
      setHistory(prev => {
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const memory = (Number.parseInt(stats.info.memory?.used_memory || '0', 10) / 1024 / 1024).toFixed(2); // MB
        const ops = Number.parseInt(stats.info.stats?.instantaneous_ops_per_sec || '0', 10);
        const cpu = Number.parseFloat(stats.info.cpu?.used_cpu_sys || '0') + Number.parseFloat(stats.info.cpu?.used_cpu_user || '0');
        
        const newPoint = {
          time: timeStr,
          memory: Number.parseFloat(memory),
          ops,
          cpu,
          clients: Number.parseInt(stats.info.clients?.connected_clients || '0', 10)
        };

        const newHistory = [...prev, newPoint];
        if (newHistory.length > 20) newHistory.shift(); // Keep last 20 points
        return newHistory;
      });
    }
  }, [stats]);

  if (!currentConnection) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Activity className="w-16 h-16 mb-4 opacity-20" />
        <h2 className="text-xl font-medium text-zinc-300">No Connection Selected</h2>
        <p className="mt-2 text-sm">Select a connection to view server statistics.</p>
      </div>
    );
  }

  if (isLoading && history.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400">
        <div className="animate-spin mr-2 h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full"></div>
        Loading statistics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-400 p-6">
        <Activity className="w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-lg font-medium">Failed to load statistics</h3>
        <p className="text-sm text-red-500/80 mt-2">{(error as Error).message}</p>
      </div>
    );
  }

  const memoryUsed = stats?.info?.memory?.used_memory_human || '0B';
  const memoryPeak = stats?.info?.memory?.used_memory_peak_human || '0B';
  const connectedClients = stats?.info?.clients?.connected_clients || 0;
  const uptime = stats?.info?.server?.uptime_in_days || 0;
  const version = stats?.info?.server?.redis_version || 'Unknown';

  return (
    <div className="h-full overflow-y-auto p-6 bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Memory Usage" 
            value={memoryUsed} 
            subValue={`Peak: ${memoryPeak}`}
            icon={<HardDrive className="w-5 h-5 text-blue-400" />} 
          />
          <StatCard 
            title="Connected Clients" 
            value={connectedClients} 
            subValue="Active Connections"
            icon={<Users className="w-5 h-5 text-green-400" />} 
          />
          <StatCard 
            title="CPU Load" 
            value={`${stats?.info?.cpu?.used_cpu_sys || 0}`} 
            subValue="System CPU"
            icon={<Cpu className="w-5 h-5 text-purple-400" />} 
          />
          <StatCard 
            title="Server Info" 
            value={`v${version}`} 
            subValue={`Uptime: ${uptime} days`}
            icon={<Terminal className="w-5 h-5 text-orange-400" />} 
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Real-time Memory Usage (MB)">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" fontSize={12} tick={{fill: '#666'}} />
                <YAxis stroke="#666" fontSize={12} tick={{fill: '#666'}} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Area type="monotone" dataKey="memory" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMemory)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Instantaneous Operations / Sec">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#666" fontSize={12} tick={{fill: '#666'}} />
                <YAxis stroke="#666" fontSize={12} tick={{fill: '#666'}} />
                <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                />
                <Line type="monotone" dataKey="ops" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2: Command Stats */}
        <div className="grid grid-cols-1 gap-6">
          <ChartCard title="Top Commands (Calls)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.commandStats?.slice(0, 15) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tick={{fill: '#666'}} />
                <YAxis stroke="#666" fontSize={12} tick={{fill: '#666'}} />
                <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#e4e4e7' }}
                   cursor={{fill: '#27272a'}}
                />
                <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Clients List */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="font-medium text-zinc-200">Connected Clients</h3>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              Total: {stats?.clients?.length || 0}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-900 text-zinc-500 uppercase text-xs font-medium">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Address</th>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Age (s)</th>
                  <th className="px-6 py-3">Idle (s)</th>
                  <th className="px-6 py-3">Flags</th>
                  <th className="px-6 py-3">Cmd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {stats?.clients?.slice(0, 10).map((client: any) => (
                  <tr key={client.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs">{client.id}</td>
                    <td className="px-6 py-3">{client.addr}</td>
                    <td className="px-6 py-3 text-zinc-300">{client.name || '-'}</td>
                    <td className="px-6 py-3">{client.age}</td>
                    <td className="px-6 py-3">{client.idle}</td>
                    <td className="px-6 py-3">{client.flags}</td>
                    <td className="px-6 py-3 font-mono text-xs text-blue-400">{client.cmd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats?.clients && stats.clients.length > 10 && (
              <div className="px-6 py-3 text-center text-xs text-zinc-500 border-t border-zinc-800">
                Showing top 10 of {stats.clients.length} clients
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon }: { title: string, value: string | number, subValue: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-zinc-400 text-sm font-medium">{title}</h3>
        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-zinc-100">{value}</div>
        <div className="text-xs text-zinc-500 mt-1">{subValue}</div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-[350px] flex flex-col">
      <h3 className="text-zinc-200 font-medium mb-6 text-sm">{title}</h3>
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>
    </div>
  );
}
