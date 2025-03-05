
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ref, push, get, serverTimestamp } from 'firebase/database';
import { db } from '@/services/firebase';
import { useToast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2 } from 'lucide-react';

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

interface QuotationItem {
  productId: string;
  quantity: number;
  product?: Product;
}

const quotationSchema = z.object({
  customerId: z.string().min(1, { message: 'Please select a customer' }),
  validUntil: z.string().min(1, { message: 'Please provide a validity date' }),
  notes: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

const QuotationForm: React.FC = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [total, setTotal] = useState(0);
  
  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      notes: '',
    },
  });

  useEffect(() => {
    // Fetch customers
    const fetchCustomers = async () => {
      try {
        const customersRef = ref(db, 'customers');
        const snapshot = await get(customersRef);
        
        if (snapshot.exists()) {
          const customersData: Customer[] = [];
          snapshot.forEach((childSnapshot) => {
            customersData.push({
              id: childSnapshot.key as string,
              ...childSnapshot.val(),
            });
          });
          setCustomers(customersData);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customers. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    // Fetch products
    const fetchProducts = async () => {
      try {
        const productsRef = ref(db, 'products');
        const snapshot = await get(productsRef);
        
        if (snapshot.exists()) {
          const productsData: Product[] = [];
          snapshot.forEach((childSnapshot) => {
            productsData.push({
              id: childSnapshot.key as string,
              ...childSnapshot.val(),
            });
          });
          setProducts(productsData);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products. Please try again.',
          variant: 'destructive',
        });
      }
    };
    
    fetchCustomers();
    fetchProducts();
  }, [toast]);

  // Update selected customer when customerId changes
  useEffect(() => {
    const customerId = form.watch('customerId');
    if (customerId) {
      const customer = customers.find(c => c.id === customerId) || null;
      setSelectedCustomer(customer);
    } else {
      setSelectedCustomer(null);
    }
  }, [form.watch('customerId'), customers]);

  // Calculate total whenever quotation items change
  useEffect(() => {
    let sum = 0;
    quotationItems.forEach(item => {
      if (item.product) {
        sum += item.product.price * item.quantity;
      }
    });
    setTotal(sum);
  }, [quotationItems]);

  const addQuotationItem = () => {
    setQuotationItems([...quotationItems, { productId: '', quantity: 1 }]);
  };

  const removeQuotationItem = (index: number) => {
    const updatedItems = [...quotationItems];
    updatedItems.splice(index, 1);
    setQuotationItems(updatedItems);
  };

  const updateQuotationItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updatedItems = [...quotationItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If we're updating the productId, also update the product reference
    if (field === 'productId') {
      const productId = value as string;
      const product = products.find(p => p.id === productId);
      updatedItems[index].product = product;
    }
    
    setQuotationItems(updatedItems);
  };

  const onSubmit = async (data: QuotationFormValues) => {
    try {
      // Validate quotation items
      if (quotationItems.length === 0) {
        toast({
          title: 'Error',
          description: 'Please add at least one product to the quotation',
          variant: 'destructive',
        });
        return;
      }
      
      for (const item of quotationItems) {
        if (!item.productId) {
          toast({
            title: 'Error',
            description: 'Please select a product for each quotation item',
            variant: 'destructive',
          });
          return;
        }
        
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          toast({
            title: 'Error',
            description: 'One or more products not found',
            variant: 'destructive',
          });
          return;
        }
        
        if (item.quantity > product.quantity) {
          toast({
            title: 'Error',
            description: `Only ${product.quantity} units of ${product.name} are available`,
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Create quotation object
      const quotationData = {
        ...data,
        items: quotationItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product?.price || 0,
          subtotal: (item.product?.price || 0) * item.quantity,
        })),
        totalAmount: total,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      // Save to Firebase
      const quotationsRef = ref(db, 'quotations');
      await push(quotationsRef, quotationData);
      
      toast({
        title: 'Success',
        description: 'Quotation created successfully',
      });
      
      // Reset form
      form.reset();
      setQuotationItems([]);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error creating quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quotation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="dashboard-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Create New Quotation</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="validUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {selectedCustomer && (
              <div className="bg-muted p-4 rounded-md mt-4">
                <h3 className="font-medium mb-2">Customer Details</h3>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedCustomer.phone}</p>
                  <p><span className="font-medium">Location:</span> {selectedCustomer.location}</p>
                  <p><span className="font-medium">Address:</span> {selectedCustomer.address}</p>
                </div>
              </div>
            )}
            
            <div className="border border-border rounded-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Products</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addQuotationItem}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" /> Add Product
                </Button>
              </div>
              
              {quotationItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  No products added. Click "Add Product" to start.
                </p>
              ) : (
                <div className="space-y-4">
                  {quotationItems.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    
                    return (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6">
                          <FormLabel htmlFor={`product-${index}`}>Product</FormLabel>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateQuotationItem(index, 'productId', value)}
                          >
                            <SelectTrigger id={`product-${index}`}>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.quantity} available)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <FormLabel htmlFor={`quantity-${index}`}>Quantity</FormLabel>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            max={product?.quantity || 1}
                            value={item.quantity}
                            onChange={(e) => updateQuotationItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="col-span-3">
                          <FormLabel>Subtotal</FormLabel>
                          <div className="h-10 flex items-center px-3 border rounded-md bg-muted/50">
                            ₹ {product ? (product.price * item.quantity).toFixed(2) : '0.00'}
                          </div>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuotationItem(index)}
                            className="h-10 w-10 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="flex justify-end mt-4 pt-4 border-t">
                    <div className="text-right">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 text-lg font-bold">₹ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional information or terms and conditions" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <CardFooter className="px-0 pt-4">
              <Button 
                type="submit" 
                className="button-shine"
                disabled={quotationItems.length === 0}
              >
                Create Quotation
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default QuotationForm;
