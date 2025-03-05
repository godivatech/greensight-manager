
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ref, onValue } from 'firebase/database';
import { db } from '@/services/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CircleDollarSign, Package, Receipt, Users } from 'lucide-react';

interface DashboardStats {
  customers: number;
  products: number;
  quotations: number;
  invoices: number;
  totalSales: number;
  productsByCategory: { name: string; value: number }[];
  recentTransactions: { month: string; amount: number }[];
}

const StatsOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    products: 0,
    quotations: 0,
    invoices: 0,
    totalSales: 0,
    productsByCategory: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Customers count
        const customersRef = ref(db, 'customers');
        onValue(customersRef, (snapshot) => {
          const customersCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
          setStats(prev => ({ ...prev, customers: customersCount }));
        });

        // Products count and categories
        const productsRef = ref(db, 'products');
        onValue(productsRef, (snapshot) => {
          if (snapshot.exists()) {
            const products = snapshot.val();
            const productKeys = Object.keys(products);
            
            // Count products
            setStats(prev => ({ ...prev, products: productKeys.length }));
            
            // Group products by type
            const categories: Record<string, number> = {};
            productKeys.forEach(key => {
              const type = products[key].type || 'Other';
              categories[type] = (categories[type] || 0) + 1;
            });
            
            const categoryData = Object.keys(categories).map(key => ({
              name: key,
              value: categories[key]
            }));
            
            setStats(prev => ({ ...prev, productsByCategory: categoryData }));
          } else {
            setStats(prev => ({ ...prev, products: 0, productsByCategory: [] }));
          }
        });

        // Quotations count
        const quotationsRef = ref(db, 'quotations');
        onValue(quotationsRef, (snapshot) => {
          const quotationsCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
          setStats(prev => ({ ...prev, quotations: quotationsCount }));
        });

        // Invoices count and total sales
        const invoicesRef = ref(db, 'invoices');
        onValue(invoicesRef, (snapshot) => {
          if (snapshot.exists()) {
            const invoices = snapshot.val();
            const invoiceKeys = Object.keys(invoices);
            
            // Count invoices
            setStats(prev => ({ ...prev, invoices: invoiceKeys.length }));
            
            // Calculate total sales
            let totalSales = 0;
            const monthlySales: Record<string, number> = {};
            
            invoiceKeys.forEach(key => {
              const invoice = invoices[key];
              if (invoice.status !== 'cancelled') {
                totalSales += invoice.totalAmount || 0;
                
                // Group by month for chart
                const date = new Date(invoice.invoiceDate);
                const monthYear = date.toLocaleString('default', { month: 'short', year: '2-digit' });
                monthlySales[monthYear] = (monthlySales[monthYear] || 0) + (invoice.totalAmount || 0);
              }
            });
            
            const last6Months = Object.keys(monthlySales)
              .sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateB.getTime() - dateA.getTime();
              })
              .slice(0, 6)
              .reverse();
            
            const recentTransactions = last6Months.map(month => ({
              month,
              amount: monthlySales[month]
            }));
            
            setStats(prev => ({ 
              ...prev, 
              totalSales,
              recentTransactions
            }));
          } else {
            setStats(prev => ({ 
              ...prev, 
              invoices: 0,
              totalSales: 0,
              recentTransactions: []
            }));
          }
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dashboard-stats">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <h3 className="text-2xl font-bold mt-1">{stats.customers}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-stats">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <h3 className="text-2xl font-bold mt-1">{stats.products}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-stats">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Quotations</p>
                <h3 className="text-2xl font-bold mt-1">{stats.quotations}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-stats">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <h3 className="text-xl font-bold mt-1">{formatCurrency(stats.totalSales)}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <CircleDollarSign className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentTransactions.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={stats.recentTransactions}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis 
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('en-IN', {
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(value)
                      } 
                    />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Amount']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Bar dataKey="amount" fill="#10b981" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Receipt className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No sales data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Products by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.productsByCategory.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={stats.productsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stats.productsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} products`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No product categories available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsOverview;
