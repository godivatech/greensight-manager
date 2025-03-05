
import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, FileText, Trash2 } from 'lucide-react';
import InvoiceGenerator from '../invoices/InvoiceGenerator';

interface QuotationItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productName?: string;
}

interface Quotation {
  id: string;
  customerId: string;
  customerName?: string;
  items: QuotationItem[];
  totalAmount: number;
  validUntil: string;
  status: 'pending' | 'approved' | 'rejected' | 'invoiced';
  notes?: string;
  createdAt: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  address: string;
  location: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  type: string;
  voltage: string;
  rating: string;
  make: string;
  quantity: number;
  unit: string;
  price: number;
}

const QuotationList: React.FC = () => {
  const { toast } = useToast();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

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
    
    // Fetch products
    const productsRef = ref(db, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const productsData: Record<string, Product> = {};
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const productKey = childSnapshot.key;
          if (productKey) {
            productsData[productKey] = {
              id: productKey,
              ...childSnapshot.val(),
            };
          }
        });
      }
      
      setProducts(productsData);
    });
    
    // Fetch quotations
    const quotationsRef = ref(db, 'quotations');
    const unsubscribeQuotations = onValue(quotationsRef, (snapshot) => {
      const quotationsData: Quotation[] = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const quotationKey = childSnapshot.key;
          if (quotationKey) {
            const quotationData = childSnapshot.val();
            
            quotationsData.push({
              id: quotationKey,
              ...quotationData,
              createdAt: quotationData.createdAt || Date.now(),
            });
          }
        });
      }
      
      // Sort by creation date (newest first)
      quotationsData.sort((a, b) => b.createdAt - a.createdAt);
      setQuotations(quotationsData);
      setFilteredQuotations(quotationsData);
    });
    
    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
      unsubscribeQuotations();
    };
  }, []);

  // Update quotations with customer and product names
  useEffect(() => {
    if (Object.keys(customers).length > 0 && Object.keys(products).length > 0) {
      const updatedQuotations = quotations.map(quotation => {
        const customer = customers[quotation.customerId];
        
        const quotationWithNames = {
          ...quotation,
          customerName: customer?.name || 'Unknown Customer',
          items: quotation.items.map(item => ({
            ...item,
            productName: products[item.productId]?.name || 'Unknown Product',
          })),
        };
        
        return quotationWithNames;
      });
      
      setQuotations(updatedQuotations);
      handleSearch(searchTerm, updatedQuotations);
    }
  }, [customers, products]);

  const handleSearch = (term: string, quotationsData = quotations) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredQuotations(quotationsData);
      return;
    }
    
    const lowercaseTerm = term.toLowerCase();
    const filtered = quotationsData.filter(quotation => 
      quotation.customerName?.toLowerCase().includes(lowercaseTerm) ||
      quotation.id.toLowerCase().includes(lowercaseTerm) ||
      quotation.items.some(item => 
        item.productName?.toLowerCase().includes(lowercaseTerm)
      )
    );
    
    setFilteredQuotations(filtered);
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    try {
      const quotationRef = ref(db, `quotations/${quotationId}`);
      await remove(quotationRef);
      
      toast({
        title: 'Success',
        description: 'Quotation deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete quotation. Please try again.',
        variant: 'destructive',
      });
    }
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

  return (
    <Card className="dashboard-card animate-fade-in">
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <CardTitle className="text-xl font-semibold">Quotation List</CardTitle>
        <div className="relative">
          <Input
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-[300px]"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredQuotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Quotations Found</h3>
            <p className="text-muted-foreground text-center max-w-md mt-2">
              {searchTerm ? 'No quotations match your search criteria. Try different keywords.' : 'No quotations have been created yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations.map((quotation) => (
                  <TableRow key={quotation.id}>
                    <TableCell className="font-medium">{quotation.id.slice(0, 6)}</TableCell>
                    <TableCell>{quotation.customerName}</TableCell>
                    <TableCell>{formatDateTime(quotation.createdAt)}</TableCell>
                    <TableCell>{formatDate(quotation.validUntil)}</TableCell>
                    <TableCell>{formatCurrency(quotation.totalAmount)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        quotation.status === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : quotation.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : quotation.status === 'invoiced'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setSelectedQuotation(quotation)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Quotation Details</DialogTitle>
                              <DialogDescription>
                                Quotation #{quotation.id.slice(0, 6)} for {quotation.customerName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid grid-cols-1 gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-1">Customer Information</h4>
                                  <div className="bg-muted p-3 rounded-md text-sm">
                                    <p className="font-medium">{customers[quotation.customerId]?.name}</p>
                                    <p>{customers[quotation.customerId]?.email}</p>
                                    <p>{customers[quotation.customerId]?.phone}</p>
                                    <p>{customers[quotation.customerId]?.location}</p>
                                    <p className="mt-1">{customers[quotation.customerId]?.address}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-1">Quotation Details</h4>
                                  <div className="bg-muted p-3 rounded-md text-sm">
                                    <p><span className="font-medium">Created:</span> {formatDateTime(quotation.createdAt)}</p>
                                    <p><span className="font-medium">Valid Until:</span> {formatDate(quotation.validUntil)}</p>
                                    <p><span className="font-medium">Status:</span> {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}</p>
                                    <p><span className="font-medium">Total Amount:</span> {formatCurrency(quotation.totalAmount)}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-1">Products</h4>
                                <div className="border rounded-md overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {quotation.items.map((item, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{item.productName || products[item.productId]?.name || 'Unknown Product'}</TableCell>
                                          <TableCell className="text-right">{item.quantity}</TableCell>
                                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                          <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                                        </TableRow>
                                      ))}
                                      <TableRow>
                                        <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                                        <TableCell className="text-right font-bold">{formatCurrency(quotation.totalAmount)}</TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                              
                              {quotation.notes && (
                                <div>
                                  <h4 className="font-medium mb-1">Notes</h4>
                                  <div className="bg-muted p-3 rounded-md text-sm">
                                    <p>{quotation.notes}</p>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex justify-end mt-4 space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedQuotation(quotation);
                                    setShowInvoice(true);
                                  }}
                                >
                                  Generate Invoice
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this quotation? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteQuotation(quotation.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {showInvoice && selectedQuotation && (
        <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Invoice</DialogTitle>
              <DialogDescription>
                Create an invoice based on quotation #{selectedQuotation.id.slice(0, 6)}
              </DialogDescription>
            </DialogHeader>
            
            <InvoiceGenerator 
              quotation={selectedQuotation} 
              customer={customers[selectedQuotation.customerId]} 
              products={products} 
              onClose={() => setShowInvoice(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default QuotationList;
