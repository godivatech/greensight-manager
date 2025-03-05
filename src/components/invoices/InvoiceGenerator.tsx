
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ref, push, update, serverTimestamp } from 'firebase/database';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileDown, Printer } from 'lucide-react';

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

interface InvoiceGeneratorProps {
  quotation: Quotation;
  customer: Customer;
  products: Record<string, Product>;
  onClose: () => void;
}

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, { message: 'Invoice number is required' }),
  invoiceDate: z.string().min(1, { message: 'Invoice date is required' }),
  paymentTerms: z.string().min(1, { message: 'Payment terms are required' }),
  warrantyPeriod: z.string().optional(),
  notes: z.string().optional(),
  additionalItems: z.array(
    z.object({
      description: z.string().min(1, { message: 'Description is required' }),
      amount: z.number().min(0, { message: 'Amount must be a positive number' }),
    })
  ).optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ 
  quotation, 
  customer, 
  products,
  onClose 
}) => {
  const { toast } = useToast();
  const [invoiceType, setInvoiceType] = useState<'customer' | 'company'>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentTerms: '100% advance payment',
      warrantyPeriod: '1 year standard warranty',
      notes: '',
      additionalItems: [],
    },
  });

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Calculate total with additional items
      let totalAmount = quotation.totalAmount;
      if (data.additionalItems && data.additionalItems.length > 0) {
        data.additionalItems.forEach(item => {
          totalAmount += item.amount;
        });
      }
      
      // Create invoice object
      const invoiceData = {
        ...data,
        quotationId: quotation.id,
        customerId: customer.id,
        items: quotation.items,
        totalAmount,
        type: invoiceType,
        status: 'active',
        createdAt: serverTimestamp(),
      };
      
      // Save invoice to Firebase
      const invoicesRef = ref(db, 'invoices');
      const newInvoiceRef = await push(invoicesRef, invoiceData);
      
      // Update quotation status to invoiced
      const quotationRef = ref(db, `quotations/${quotation.id}`);
      await update(quotationRef, { status: 'invoiced' });
      
      toast({
        title: 'Success',
        description: 'Invoice generated successfully',
      });
      
      // Temporarily alert for PDF generation as implementation will depend on specific requirements
      setTimeout(() => {
        alert(`Invoice ${data.invoiceNumber} generated successfully. In a production environment, this would trigger the PDF generation and download process.`);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAdditionalItem = () => {
    const currentItems = form.getValues('additionalItems') || [];
    form.setValue('additionalItems', [
      ...currentItems,
      { description: '', amount: 0 },
    ]);
  };

  const removeAdditionalItem = (index: number) => {
    const currentItems = form.getValues('additionalItems') || [];
    const updatedItems = [...currentItems];
    updatedItems.splice(index, 1);
    form.setValue('additionalItems', updatedItems);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Preview invoice (simplified implementation)
  const InvoicePreview = () => {
    const formData = form.getValues();
    
    return (
      <div className="border rounded-md p-4 my-4 bg-card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Prakash Green Energy</h2>
            <p>123 Solar Lane, Green City</p>
            <p>info@prakashgreen.com</p>
            <p>+91 9876543210</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold">INVOICE</h3>
            <p><span className="font-medium">Invoice #:</span> {formData.invoiceNumber}</p>
            <p><span className="font-medium">Date:</span> {formData.invoiceDate}</p>
            <p><span className="font-medium">Payment Terms:</span> {formData.paymentTerms}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-bold mb-2">Bill To:</h4>
            <p className="font-medium">{customer.name}</p>
            <p>{customer.address}</p>
            <p>{customer.location}</p>
            <p>Phone: {customer.phone}</p>
            <p>Email: {customer.email}</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Details:</h4>
            <p><span className="font-medium">Quote Reference:</span> {quotation.id.slice(0, 6)}</p>
            <p><span className="font-medium">Warranty:</span> {formData.warrantyPeriod}</p>
          </div>
        </div>
        
        <table className="w-full mb-6">
          <thead className="border-b">
            <tr>
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">
                  {item.productName || products[item.productId]?.name || 'Unknown Product'}
                  <div className="text-xs text-muted-foreground">
                    {products[item.productId]?.type} | {products[item.productId]?.voltage}V | {products[item.productId]?.rating}
                  </div>
                </td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right">{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
            
            {formData.additionalItems && formData.additionalItems.map((item, index) => (
              item.description && (
                <tr key={`additional-${index}`} className="border-b">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">1</td>
                  <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                  <td className="py-2 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              )
            ))}
            
            <tr>
              <td colSpan={3} className="py-2 text-right font-bold">Total</td>
              <td className="py-2 text-right font-bold">
                {formatCurrency(
                  quotation.totalAmount + 
                  (formData.additionalItems?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0)
                )}
              </td>
            </tr>
          </tbody>
        </table>
        
        {formData.notes && (
          <div className="mb-6">
            <h4 className="font-bold mb-2">Notes:</h4>
            <p className="text-sm">{formData.notes}</p>
          </div>
        )}
        
        <div className="mt-10 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Thank you for your business with Prakash Green Energy!</p>
          <p className="mt-1">For any inquiries please contact us at support@prakashgreen.com</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4 mb-6">
        <Button
          variant={invoiceType === 'customer' ? 'default' : 'outline'}
          onClick={() => setInvoiceType('customer')}
        >
          Customer Invoice
        </Button>
        <Button
          variant={invoiceType === 'company' ? 'default' : 'outline'}
          onClick={() => setInvoiceType('company')}
        >
          Company Invoice
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="paymentTerms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Terms</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="100% advance payment">100% Advance Payment</SelectItem>
                      <SelectItem value="50% advance, 50% on delivery">50% Advance, 50% on Delivery</SelectItem>
                      <SelectItem value="30 days from invoice date">30 Days from Invoice Date</SelectItem>
                      <SelectItem value="15 days from invoice date">15 Days from Invoice Date</SelectItem>
                      <SelectItem value="due on receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="warrantyPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty Period</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warranty period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1 year standard warranty">1 Year Standard Warranty</SelectItem>
                      <SelectItem value="2 year extended warranty">2 Year Extended Warranty</SelectItem>
                      <SelectItem value="5 year full warranty">5 Year Full Warranty</SelectItem>
                      <SelectItem value="10 year limited warranty">10 Year Limited Warranty</SelectItem>
                      <SelectItem value="No warranty">No Warranty</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Additional Items (Optional)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAdditionalItem}
              >
                Add Item
              </Button>
            </div>
            
            {form.watch('additionalItems')?.map((_, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 mb-2">
                <div className="col-span-8">
                  <Input
                    placeholder="Description"
                    {...form.register(`additionalItems.${index}.description` as const)}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder="Amount"
                    min="0"
                    {...form.register(`additionalItems.${index}.amount` as const, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div className="col-span-1 flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeAdditionalItem(index)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional notes or terms for this invoice"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Invoice Preview</h3>
            <InvoicePreview />
          </div>
          
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> Print Preview
            </Button>
            <Button type="submit" className="gap-2" disabled={isSubmitting}>
              <FileDown className="h-4 w-4" /> Generate Invoice
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default InvoiceGenerator;
