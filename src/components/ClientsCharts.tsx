import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ClientsChartsProps {
  clients: {
    status: "completado" | "en_proceso" | "sin_exito";
    createdAt?: string;
    date: string;
    serviceType: string;
    quotesCount: number;
    name: string;
    company: string;
  }[];
}

const parseClientDate = (client: ClientsChartsProps["clients"][number]): Date | null => {
  if (client.createdAt) {
    const d = new Date(client.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (client.date) {
    const d = new Date(client.date);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

export function ClientsCharts({ clients }: ClientsChartsProps) {
  const statusData = useMemo(() => {
    const counters = {
      completado: 0,
      en_proceso: 0,
      sin_exito: 0,
    };

    clients.forEach((client) => {
      counters[client.status] = counters[client.status] + 1;
    });

    return [
      { status: "Completado", value: counters.completado },
      { status: "En proceso", value: counters.en_proceso },
      { status: "Sin éxito", value: counters.sin_exito },
    ];
  }, [clients]);

  const serviceTypeData = useMemo(() => {
    const map = new Map<string, number>();

    clients
      .filter((client) => client.status !== "sin_exito")
      .forEach((client) => {
        const key = client.serviceType || "Otro";
        map.set(key, (map.get(key) || 0) + 1);
      });

    const entries = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return entries.map(([serviceType, value]) => ({
      serviceType,
      value,
    }));
  }, [clients]);

  const newClientsTrend = useMemo(() => {
    const now = new Date();
    const months: { label: string; year: number; month: number; value: number }[] = [];

    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        value: 0,
      });
    }

    clients.forEach((client) => {
      const d = parseClientDate(client);
      if (!d) return;

      const monthIndex = months.findIndex(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth(),
      );

      if (monthIndex !== -1) {
        months[monthIndex].value += 1;
      }
    });

    return months;
  }, [clients]);

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status !== "sin_exito").length;
  const currentMonthNew =
    newClientsTrend.length > 0
      ? newClientsTrend[newClientsTrend.length - 1]?.value ?? 0
      : 0;

  const inactiveClientsData = useMemo(() => {
    const now = new Date();
    const threshold = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      now.getDate(),
    );

    const items = clients
      .map((client) => {
        const d = parseClientDate(client);
        return { client, date: d };
      })
      .filter(
        (item) =>
          item.date !== null &&
          (item.date as Date) < threshold,
      )
      .sort(
        (a, b) =>
          (b.client.quotesCount || 0) -
          (a.client.quotesCount || 0),
      )
      .slice(0, 8);

    return items.map(({ client }) => ({
      label: client.company || client.name,
      quotes: client.quotesCount || 0,
    }));
  }, [clients]);

  const favoriteClientsData = useMemo(() => {
    return [...clients]
      .filter((client) => (client.quotesCount || 0) > 0)
      .sort(
        (a, b) =>
          (b.quotesCount || 0) -
          (a.quotesCount || 0),
      )
      .slice(0, 8)
      .map((client) => ({
        label: client.company || client.name,
        quotes: client.quotesCount || 0,
      }));
  }, [clients]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between">
            <span>Total de clientes</span>
            <span className="text-xs text-gray-900 font-semibold">
              {totalClients}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} margin={{ top: 8, left: -20, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="status"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(248, 113, 113, 0.12)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #fecaca",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
        </Card>

        <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between">
            <span>Clientes activos</span>
            <span className="text-xs text-gray-900 font-semibold">
              {activeClients}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={serviceTypeData}
              margin={{ top: 8, left: -20, right: 8 }}
            >
              <defs>
                <linearGradient id="activeArea" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#ef4444"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="#ef4444"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="serviceType"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #fecaca",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                fill="url(#activeArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
        </Card>

        <Card className="border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between">
            <span>Nuevos este mes</span>
            <span className="text-xs text-gray-900 font-semibold">
              {currentMonthNew}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={newClientsTrend}
              margin={{ top: 8, left: -20, right: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #fecaca",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between">
              <span>Clientes inactivos (+3 meses)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 h-52">
            {inactiveClientsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Sin clientes inactivos registrados
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={inactiveClientsData}
                  margin={{ top: 8, left: 0, right: 8, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(248, 113, 113, 0.12)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="quotes"
                    radius={[4, 4, 0, 0]}
                    fill="#ef4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center justify-between">
              <span>Clientes favoritos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 h-52">
            {favoriteClientsData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Sin clientes con cotizaciones registradas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={favoriteClientsData}
                  layout="vertical"
                  margin={{ top: 8, left: 0, right: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(248, 113, 113, 0.12)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #fecaca",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="quotes"
                    radius={[0, 4, 4, 0]}
                    fill="#ef4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
