
import React, { useState, useEffect } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { db } from '@/services/firebase';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, FileDown, Printer } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  location: string;
  phone: string;
}

interface QuotationItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productName?: string;
}

interface AdditionalItem {
  description: string;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string;
  customerName?: string;
  quotationId: string;
  items: QuotationItem[];
  additionalItems?: AdditionalItem[];
  totalAmount: number;
  paymentTerms: string;
  warrantyPeriod?: string;
  notes?: string;
  type: 'customer' | 'company';
  status: 'active' | 'paid' | 'cancelled';
  createdAt: number;
}

const InvoiceList: React.FC = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    // Fetch customers
    const customersRef = ref(db, 'customers');
    const unsubscribeCustomers = onValue(customersRef, (snapshot) => {
      const customersData: Record<string, Customer> = {};
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const customerKey = childSnapshot.key;
          if (customerKey) {
            customersData[customerKey] = {
              id: customerKey,
              ...childSnapshot.val(),
            };
          }
        });
      }
      
      setCustomers(customersData);
    });
    
    // Fetch invoices
    const invoicesRef = ref(db, 'invoices');
    const unsubscribeInvoices = onValue(invoicesRef, (snapshot) => {
      const invoicesData: Invoice[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const invoiceKey = childSnapshot.key;
          if (invoiceKey) {
            const invoiceData = childSnapshot.val();
            
            invoicesData.push({
              id: invoiceKey,
              ...invoiceData,
              createdAt: invoiceData.createdAt || Date.now(),
            });
          }
        });
      }
      
      // Sort by creation date (newest first)
      invoicesData.sort((a, b) => b.createdAt - a.createdAt);
      setInvoices(invoicesData);
      setFilteredInvoices(invoicesData);
    });
    
    return () => {
      unsubscribeCustomers();
      unsubscribeInvoices();
    };
  }, []);

  // Update invoices with customer names
  useEffect(() => {
    if (Object.keys(customers).length > 0) {
      const updatedInvoices = invoices.map(invoice => {
        const customer = customers[invoice.customerId];
        
        return {
          ...invoice,
          customerName: customer?.name || 'Unknown Customer',
        };
      });
      
      setInvoices(updatedInvoices);
      handleSearch(searchTerm, updatedInvoices);
    }
  }, [customers]);

  const handleSearch = (term: string, invoicesData = invoices) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredInvoices(invoicesData);
      return;
    }
    
    const lowercaseTerm = term.toLowerCase();
    const filtered = invoicesData.filter(invoice => 
      invoice.customerName?.toLowerCase().includes(lowercaseTerm) ||
      invoice.invoiceNumber.toLowerCase().includes(lowercaseTerm) ||
      invoice.id.toLowerCase().includes(lowercaseTerm)
    );
    
    setFilteredInvoices(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const printInvoice = () => {
    window.print();
  };

  const downloadInvoice = (invoice: Invoice) => {
    // In a real application, this would generate and download a PDF
    alert(`Invoice ${invoice.invoiceNumber} would be downloaded as PDF in a production environment.`);
  };

  // Invoice detail view component
  const InvoiceDetailView = ({ invoice }: { invoice: Invoice }) => {
    const customer = customers[invoice.customerId];
    
    if (!customer) {
      return <div>Loading customer details...</div>;
    }
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-primary">Prakash Green Energy</h2>
            <p>123 Solar Lane, Green City</p>
            <p>info@prakashgreen.com</p>
            <p>+91 9876543210</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold">INVOICE</h3>
            <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
            <p><span className="font-medium">Date:</span> {formatDate(invoice.invoiceDate)}</p>
            <p><span className="font-medium">Type:</span> {invoice.type === 'customer' ? 'Customer Invoice' : 'Company Invoice'}</p>
            <p><span className="font-medium">Status:</span> {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold mb-2">Bill To:</h4>
            <p className="font-medium">{customer.name}</p>
            <p>{customer.address}</p>
            <p>{customer.location}</p>
            <p>Phone: {customer.phone}</p>
            <p>Email: {customer.email}</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Invoice Details:</h4>
            <p><span className="font-medium">Quote Reference:</span> {invoice.quotationId.slice(0, 6)}</p>
            <p><span className="font-medium">Payment Terms:</span> {invoice.paymentTerms}</p>
            {invoice.warrantyPeriod && (
              <p><span className="font-medium">Warranty:</span> {invoice.warrantyPeriod}</p>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.productName || 'Product'}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                </TableRow>
              ))}
              
              {invoice.additionalItems && invoice.additionalItems.length > 0 && (
                invoice.additionalItems.map((item, index) => (
                  <TableRow key={`additional-${index}`}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-right">1</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))
              )}
              
              <TableRow>
                <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(invoice.totalAmount)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        {invoice.notes && (
          <div>
            <h4 className="font-bold mb-2">Notes:</h4>
            <p className="text-sm">{invoice.notes}</p>
          </div>
        )}
        
        <div className="mt-10 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>Thank you for your business with Prakash Green Energy!</p>
          <p className="mt-1">For any inquiries please contact us at support@prakashgreen.com</p>
        </div>
        
        <div className="flex justify-end gap-4 mt-4">
          <Button
            variant="outline"
            onClick={printInvoice}
            className="gap-2"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button
            variant="default"
            onClick={() => downloadInvoice(invoice)}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" /> Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="dashboard-card animate-fade-in">
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <CardTitle className="text-xl font-semibold">Invoice List</CardTitle>
        <div className="relative">
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileDown className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Invoices Found</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              {searchTerm ? 'No invoices match your search criteria. Try different keywords.' : 'No invoices have been generated yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>
                      <span className="capitalize">{invoice.type}</span>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : invoice.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Invoice Details</DialogTitle>
                            </DialogHeader>
                            {selectedInvoice && <InvoiceDetailView invoice={selectedInvoice} />}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => downloadInvoice(invoice)}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceList;
