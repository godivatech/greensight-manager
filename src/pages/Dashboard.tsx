
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsOverview from '@/components/dashboard/StatsOverview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerList from '@/components/customers/CustomerList';
import ProductList from '@/components/products/ProductList';
import QuotationList from '@/components/quotations/QuotationList';
import InvoiceList from '@/components/invoices/InvoiceList';
import { Card } from '@/components/ui/card';

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <StatsOverview />
        
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customers" className="mt-4">
            <CustomerList />
          </TabsContent>
          
          <TabsContent value="products" className="mt-4">
            <ProductList />
          </TabsContent>
          
          <TabsContent value="quotations" className="mt-4">
            <QuotationList />
          </TabsContent>
          
          <TabsContent value="invoices" className="mt-4">
            <InvoiceList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
