
import React, { useState, useEffect } from 'react';
import { 
  ref, onValue, remove, update, serverTimestamp
} from 'firebase/database';
import { db } from '@/services/firebase';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Edit, Trash2, Search, Plus, Package2, Minus, Store 
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  createdAt: number;
}

// Helper function to format product type for display
const formatProductType = (type: string): string => {
  const typeMap: Record<string, string> = {
    solar_panel: 'Solar Panel',
    inverter: 'Inverter',
    battery: 'Battery',
    controller: 'Charge Controller',
    mounting: 'Mounting Structure',
    cable: 'Cables',
    accessory: 'Accessory',
  };
  
  return typeMap[type] || type;
};

// Helper function to format unit for display
const formatUnit = (unit: string): string => {
  const unitMap: Record<string, string> = {
    piece: 'Piece',
    set: 'Set',
    meter: 'Meter',
    kg: 'Kilogram',
    bundle: 'Bundle',
  };
  
  return unitMap[unit] || unit;
};

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
  const [quantityChange, setQuantityChange] = useState(0);
  const [editForm, setEditForm] = useState<Omit<Product, 'id' | 'createdAt'>>({
    name: '',
    type: '',
    voltage: '',
    rating: '',
    make: '',
    quantity: 0,
    unit: '',
    price: 0,
  });
  
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const productsRef = ref(db, 'products');
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData: Product[] = [];
        snapshot.forEach((childSnapshot) => {
          const key = childSnapshot.key;
          const data = childSnapshot.val();
          if (key) {
            productsData.push({
              id: key,
              ...data,
            });
          }
        });
        
        // Sort by most recently added
        productsData.sort((a, b) => b.createdAt - a.createdAt);
        
        setProducts(productsData);
        setFilteredProducts(productsData);
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    let filtered = products;
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((product) => product.type === typeFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.voltage.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.rating.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, typeFilter, products]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      type: product.type,
      voltage: product.voltage,
      rating: product.rating,
      make: product.make,
      quantity: product.quantity,
      unit: product.unit,
      price: product.price,
    });
    setIsEditOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteAlertOpen(true);
  };

  const handleQuantityChange = (product: Product) => {
    setSelectedProduct(product);
    setQuantityChange(0);
    setIsQuantityDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      await remove(ref(db, `products/${selectedProduct.id}`));
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'quantity' || name === 'price') {
      setEditForm((prev) => ({ 
        ...prev, 
        [name]: parseFloat(value) 
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    try {
      await update(ref(db, `products/${selectedProduct.id}`), {
        ...editForm,
        updatedAt: serverTimestamp(),
      });
      
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      
      setIsEditOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const confirmQuantityChange = async () => {
    if (!selectedProduct) return;
    
    try {
      const newQuantity = selectedProduct.quantity + quantityChange;
      
      if (newQuantity < 0) {
        toast({
          title: 'Error',
          description: 'Quantity cannot be negative.',
          variant: 'destructive',
        });
        return;
      }
      
      await update(ref(db, `products/${selectedProduct.id}`), {
        quantity: newQuantity,
        updatedAt: serverTimestamp(),
      });
      
      const action = quantityChange > 0 ? 'added to' : 'removed from';
      const amount = Math.abs(quantityChange);
      
      toast({
        title: 'Success',
        description: `${amount} ${selectedProduct.unit}(s) ${action} inventory.`,
      });
      
      setIsQuantityDialogOpen(false);
      setSelectedProduct(null);
      setQuantityChange(0);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update quantity. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="dashboard-card animate-fade-in">
      <CardHeader className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <CardTitle className="text-xl font-semibold">Products</CardTitle>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="solar_panel">Solar Panel</SelectItem>
                <SelectItem value="inverter">Inverter</SelectItem>
                <SelectItem value="battery">Battery</SelectItem>
                <SelectItem value="controller">Charge Controller</SelectItem>
                <SelectItem value="mounting">Mounting Structure</SelectItem>
                <SelectItem value="cable">Cables</SelectItem>
                <SelectItem value="accessory">Accessory</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          {isAdmin && (
            <Button asChild className="button-shine">
              <a href="/products/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4">
              <Package2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No products found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm || typeFilter !== 'all'
                ? "No products match your search. Try different filters."
                : "You haven't added any products yet."}
            </p>
            {isAdmin && searchTerm === "" && typeFilter === 'all' && (
              <Button asChild className="mt-4 button-shine">
                <a href="/products/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </a>
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Specs</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price (₹)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{formatProductType(product.type)}</TableCell>
                    <TableCell>
                      {product.voltage && <div>{product.voltage}V</div>}
                      {product.rating && <div>{product.rating}</div>}
                    </TableCell>
                    <TableCell>{product.make}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={product.quantity <= 5 ? "text-destructive font-medium" : ""}>
                          {product.quantity} {formatUnit(product.unit)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2"
                          onClick={() => handleQuantityChange(product)}
                        >
                          <Store className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>₹{product.price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Type
                  </label>
                  <Select
                    value={editForm.type}
                    onValueChange={(value) => handleEditSelectChange('type', value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solar_panel">Solar Panel</SelectItem>
                      <SelectItem value="inverter">Inverter</SelectItem>
                      <SelectItem value="battery">Battery</SelectItem>
                      <SelectItem value="controller">Charge Controller</SelectItem>
                      <SelectItem value="mounting">Mounting Structure</SelectItem>
                      <SelectItem value="cable">Cables</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="voltage" className="text-sm font-medium">
                    Voltage (V)
                  </label>
                  <Input
                    id="voltage"
                    name="voltage"
                    value={editForm.voltage}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="rating" className="text-sm font-medium">
                    Rating
                  </label>
                  <Input
                    id="rating"
                    name="rating"
                    value={editForm.rating}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="make" className="text-sm font-medium">
                    Make/Brand
                  </label>
                  <Input
                    id="make"
                    name="make"
                    value={editForm.make}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="unit" className="text-sm font-medium">
                    Unit
                  </label>
                  <Select
                    value={editForm.unit}
                    onValueChange={(value) => handleEditSelectChange('unit', value)}
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                      <SelectItem value="meter">Meter</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="bundle">Bundle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Quantity
                  </label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={editForm.quantity}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">
                    Price (₹)
                  </label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.price}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="button-shine">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Quantity Dialog */}
      <Dialog open={isQuantityDialogOpen} onOpenChange={setIsQuantityDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Add or remove {selectedProduct?.name} from inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">Current Quantity</p>
              <p className="text-2xl font-semibold">
                {selectedProduct?.quantity} {formatUnit(selectedProduct?.unit || '')}
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantityChange((prev) => prev - 1)}
                disabled={selectedProduct?.quantity === 0 && quantityChange <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <Input
                className="w-20 text-center"
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(parseInt(e.target.value || '0', 10))}
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantityChange((prev) => prev + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">New Quantity</p>
              <p className="text-xl font-medium">
                {(selectedProduct?.quantity || 0) + quantityChange} {formatUnit(selectedProduct?.unit || '')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuantityDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmQuantityChange}
              disabled={quantityChange === 0 || ((selectedProduct?.quantity || 0) + quantityChange) < 0}
              className="button-shine"
            >
              Update Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the product{' '}
              <span className="font-semibold">{selectedProduct?.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ProductList;
