import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertProductSchema, type Product } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const formSchema = insertProductSchema.extend({
  price: z.string().min(1, 'Price is required'),
  cost: z.string().optional(),
  stock: z.string().min(1, 'Stock is required'),
  minStock: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const categories = [
  'Groceries',
  'Beverages',
  'Snacks',
  'Dairy',
  'Electronics',
  'Clothing',
  'Books',
  'Home & Garden',
  'Health & Beauty',
  'Sports & Outdoors',
];

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description ?? '',
      sku: product?.sku || '',
      barcode: product?.barcode ?? '',
      category: product?.category || '',
      price: product?.price?.toString() || '',
      cost: product?.cost?.toString() || '',
      stock: product?.stock?.toString() || '0',
      minStock: product?.minStock?.toString() || '5',
      imageUrl: product?.imageUrl ?? '',
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/products', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/products/${product!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    const productData = {
      ...data,
      // Keep as strings for database validation
      price: data.price,
      cost: data.cost || undefined,
      stock: data.stock,
      minStock: data.minStock || '5',
    };

    if (product) {
      updateProductMutation.mutate(productData);
    } else {
      createProductMutation.mutate(productData);
    }
    
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-product">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter product name"
                    {...field}
                    data-testid="input-product-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter SKU"
                    {...field}
                    data-testid="input-product-sku"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barcode</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter barcode"
                    {...field}
                    value={field.value ?? ''}
                    data-testid="input-product-barcode"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-product-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (Rs.) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    data-testid="input-product-price"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost (Rs.)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    data-testid="input-product-cost"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    data-testid="input-product-stock"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Stock Level</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="5"
                    {...field}
                    data-testid="input-product-min-stock"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter product description"
                  {...field}
                  value={field.value ?? ''}
                  data-testid="textarea-product-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...field}
                  value={field.value ?? ''}
                  data-testid="input-product-image-url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-save-product"
          >
            {isSubmitting ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-product"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
