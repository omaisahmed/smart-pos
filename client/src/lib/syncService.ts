import { indexedDBService } from './indexedDB';
import { apiRequest } from './queryClient';

class SyncService {
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Periodic sync when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingData();
      }
    }, 30000); // Every 30 seconds
  }

  async syncPendingData(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    // Don't attempt to sync if IndexedDB isn't initialized yet
    try {
      if (!indexedDBService.isInitialized()) return;
    } catch (err) {
      // defensive: if checking initialization fails, bail
      return;
    }

    this.syncInProgress = true;
    
    try {
  const pendingItems = await indexedDBService.getPendingSync();
      
      for (const item of pendingItems) {
        try {
          switch (item.type) {
            case 'transaction':
              await this.syncTransaction(item);
              break;
            case 'product':
              await this.syncProduct(item);
              break;
            case 'customer':
              await this.syncCustomer(item);
              break;
          }
          
          // Remove successfully synced item
          await indexedDBService.removePendingSync(item.id);
        } catch (error) {
          console.error(`Failed to sync ${item.type}:`, error);
          // Keep the item for retry
        }
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncTransaction(item: any): Promise<void> {
    const { transaction, items } = item.data;
    await apiRequest('POST', '/api/transactions', { transaction, items });
  }

  private async syncProduct(item: any): Promise<void> {
    const { product, action } = item.data;
    
    switch (action) {
      case 'create':
        await apiRequest('POST', '/api/products', product);
        break;
      case 'update':
        await apiRequest('PUT', `/api/products/${product.id}`, product);
        break;
      case 'delete':
        await apiRequest('DELETE', `/api/products/${product.id}`);
        break;
    }
  }

  private async syncCustomer(item: any): Promise<void> {
    const { customer, action } = item.data;
    
    switch (action) {
      case 'create':
        await apiRequest('POST', '/api/customers', customer);
        break;
      case 'update':
        await apiRequest('PUT', `/api/customers/${customer.id}`, customer);
        break;
      case 'delete':
        await apiRequest('DELETE', `/api/customers/${customer.id}`);
        break;
    }
  }

  async downloadLatestData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Download products
      const productsResponse = await fetch('/api/products');
      if (productsResponse.ok) {
        const products = await productsResponse.json();
        await indexedDBService.saveProducts(products);
      }

      // Download customers
      const customersResponse = await fetch('/api/customers');
      if (customersResponse.ok) {
        const customers = await customersResponse.json();
        await indexedDBService.saveCustomers(customers);
      }
    } catch (error) {
      console.error('Failed to download latest data:', error);
    }
  }

  getConnectionStatus(): { isOnline: boolean; syncInProgress: boolean } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
    };
  }

  async addPendingTransaction(transaction: any, items: any[]): Promise<void> {
    await indexedDBService.addPendingSync('transaction', { transaction, items });
  }

  async addPendingProduct(product: any, action: 'create' | 'update' | 'delete'): Promise<void> {
    await indexedDBService.addPendingSync('product', { product, action });
  }

  async addPendingCustomer(customer: any, action: 'create' | 'update' | 'delete'): Promise<void> {
    await indexedDBService.addPendingSync('customer', { customer, action });
  }
}

export const syncService = new SyncService();
