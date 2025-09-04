import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Barcode } from 'lucide-react';
import { Product } from '@shared/schema';

interface ProductGridProps {
  onAddToCart: (product: Product) => void;
}

export default function ProductGrid({ onAddToCart }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const categories = ['all', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive && product.stock > 0;
  });

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-4" data-testid="text-pos-title">Point of Sale</h2>
        
        {/* Search and Barcode */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
            />
          </div>
          <Button variant="outline" data-testid="button-barcode-scan">
            <Barcode className="h-4 w-4 mr-2" />
            Barcode
          </Button>
        </div>
        
        {/* Category Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
              data-testid={`category-${category}`}
            >
              {category === 'all' ? 'All' : category}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="w-full h-32 bg-muted rounded-md mb-3"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onAddToCart(product)}
              data-testid={`product-card-${product.id}`}
            >
              <CardContent className="p-4">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
                <h3 className="font-semibold text-foreground mb-1" data-testid="text-product-name">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.description || product.sku}
                </p>
                <p className="text-lg font-bold text-primary mb-1" data-testid="text-product-price">
                  Rs. {Number(product.price).toLocaleString()}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground" data-testid="text-product-stock">
                    Stock: {product.stock}
                  </p>
                  {product.stock <= (product.minStock || 5) && (
                    <Badge variant="secondary" className="text-xs">
                      Low Stock
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
