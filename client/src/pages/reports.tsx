import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Download, TrendingUp } from 'lucide-react';
import { Transaction } from '@shared/schema';

export default function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const { data: salesData = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/reports/sales', { startDate, endDate }],
    enabled: !!startDate && !!endDate,
  });

  const generateReport = () => {
    if (salesData.length === 0) {
      alert('No data to export. Please select a date range with transactions.');
      return;
    }

    // Create CSV content
    const headers = ['Transaction ID', 'Date & Time', 'Subtotal', 'Tax', 'Total'];
    const csvContent = [
      headers.join(','),
      ...salesData.map((transaction) => [
        transaction.transactionNumber,
        new Date(transaction.createdAt!).toLocaleString(),
        Number(transaction.subtotal).toLocaleString(),
        Number(transaction.tax).toLocaleString(),
        Number(transaction.total).toLocaleString(),
      ].join(',')),
      '',
      'Summary',
      `Total Sales,${totalSales.toLocaleString()}`,
      `Total Transactions,${totalTransactions}`,
      `Average Transaction,${averageTransaction.toLocaleString()}`,
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = `sales-report-${startDate}-to-${endDate}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalSales = salesData.reduce((sum, transaction) => sum + Number(transaction.total), 0);
  const totalTransactions = salesData.length;
  const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-reports-title">Reports</h1>
        <p className="text-muted-foreground">Analyze your business performance</p>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            Select Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <Button onClick={generateReport} data-testid="button-generate-report">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
          {/* <div className="mt-3 text-sm text-muted-foreground">
            Selected period: <span className="font-medium text-foreground">{new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}</span>
          </div> */}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-sales">
                  Rs. {totalSales.toLocaleString()}
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
            <div>
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-transaction-count">
                {totalTransactions}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm text-muted-foreground">Average Transaction</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-average-transaction">
                Rs. {averageTransaction.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found for the selected date range</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date & Time</TableHead>
                  {/* <TableHead>Payment Method</TableHead> */}
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((transaction) => (
                  <TableRow key={transaction.id} data-testid={`row-transaction-${transaction.id}`}>
                    <TableCell className="font-medium">
                      {transaction.transactionNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt!).toLocaleString()}
                    </TableCell>
                    {/* <TableCell className="capitalize">
                      {transaction.paymentMethod}
                    </TableCell> */}
                    <TableCell>
                      Rs. {Number(transaction.subtotal).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      Rs. {Number(transaction.tax).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      Rs. {Number(transaction.total).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
