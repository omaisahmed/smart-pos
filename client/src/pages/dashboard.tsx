import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Receipt, AlertTriangle, Users } from 'lucide-react';
import { DashboardMetrics, TransactionWithDetails } from '@/types/pos';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ['/api/transactions', { limit: 5 }],
  });

  if (metricsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-todays-sales">
                  Rs. {metrics?.todaySales?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600 dark:text-green-400 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-transactions">
                  {metrics?.totalTransactions || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Receipt className="text-blue-600 dark:text-blue-400 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-low-stock">
                  {metrics?.lowStockItems || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-orange-600 dark:text-orange-400 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-customers">
                  {metrics?.activeCustomers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600 dark:text-purple-400 h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div>
                      <p className="font-medium" data-testid="text-transaction-number">
                        {transaction.transactionNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.customer?.name || 'Walk-in Customer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600" data-testid="text-transaction-amount">
                        +Rs. {Number(transaction.total).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt!).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <SalesTrendChart />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SalesTrendChart() {
  // build last 7 days range
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  // zero out times for API
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const { data: sales = [], isLoading } = useQuery<TransactionWithDetails[]>({
    queryKey: ['/api/reports/sales', { startDate: start.toISOString(), endDate: end.toISOString() }],
  });

  // aggregate totals per day
  const dayMap: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = 0;
  }

  (sales || []).forEach((tx) => {
    const dkey = new Date(tx.createdAt as string).toISOString().slice(0, 10);
    if (!dayMap[dkey]) dayMap[dkey] = 0;
    dayMap[dkey] += Number(tx.total || 0);
  });

  const chartData = Object.keys(dayMap)
    .sort()
    .map((k) => ({ date: k, total: dayMap[k] }));

  const formatLabel = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  if (isLoading) return <div className="h-64 flex items-center justify-center">Loading chart...</div>;

  return (
    <ResponsiveContainer width="100%" height={256}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={formatLabel} />
        <YAxis />
        <Tooltip formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, 'Sales']} labelFormatter={(label) => `Date: ${label}`} />
        <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
