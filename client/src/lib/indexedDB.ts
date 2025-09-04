import { Product, Customer, Transaction, TransactionItem } from "@shared/schema";

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PendingSync {
  id: string;
  type: 'transaction' | 'product' | 'customer';
  data: any;
  timestamp: number;
}

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'SmartPOS';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Products store
        if (!db.objectStoreNames.contains('products')) {
          const productsStore = db.createObjectStore('products', { keyPath: 'id' });
          productsStore.createIndex('sku', 'sku', { unique: true });
          productsStore.createIndex('barcode', 'barcode', { unique: false });
          productsStore.createIndex('category', 'category', { unique: false });
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
          customersStore.createIndex('phone', 'phone', { unique: false });
          customersStore.createIndex('email', 'email', { unique: false });
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionsStore.createIndex('transactionNumber', 'transactionNumber', { unique: true });
          transactionsStore.createIndex('customerId', 'customerId', { unique: false });
          transactionsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Transaction items store
        if (!db.objectStoreNames.contains('transactionItems')) {
          const itemsStore = db.createObjectStore('transactionItems', { keyPath: 'id' });
          itemsStore.createIndex('transactionId', 'transactionId', { unique: false });
          itemsStore.createIndex('productId', 'productId', { unique: false });
        }

        // Cart store (for offline cart persistence)
        if (!db.objectStoreNames.contains('cart')) {
          db.createObjectStore('cart', { keyPath: 'id' });
        }

        // Pending sync store
        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Product operations
  async saveProducts(products: Product[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');

    for (const product of products) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(product);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getProducts(): Promise<Product[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProduct(id: string): Promise<Product | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['products'], 'readonly');
      const store = transaction.objectStore('products');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts();
    const searchTerm = query.toLowerCase();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm))
    );
  }

  // Customer operations
  async saveCustomers(customers: Customer[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['customers'], 'readwrite');
    const store = transaction.objectStore('customers');

    for (const customer of customers) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(customer);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getCustomers(): Promise<Customer[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['customers'], 'readonly');
      const store = transaction.objectStore('customers');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Cart operations
  async saveCart(cartItems: CartItem[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['cart'], 'readwrite');
    const store = transaction.objectStore('cart');

    // Clear existing cart
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Save new cart items
    for (const item of cartItems) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getCart(): Promise<CartItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cart'], 'readonly');
      const store = transaction.objectStore('cart');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearCart(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['cart'], 'readwrite');
      const store = transaction.objectStore('cart');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Transaction operations
  async saveTransaction(transaction: Transaction, items: TransactionItem[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const dbTransaction = this.db.transaction(['transactions', 'transactionItems'], 'readwrite');
    const transactionStore = dbTransaction.objectStore('transactions');
    const itemsStore = dbTransaction.objectStore('transactionItems');

    // Save transaction
    await new Promise<void>((resolve, reject) => {
      const request = transactionStore.put(transaction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Save transaction items
    for (const item of items) {
      await new Promise<void>((resolve, reject) => {
        const request = itemsStore.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['transactions'], 'readonly');
      const store = transaction.objectStore('transactions');
      const index = store.index('createdAt');
      const request = index.getAll();

      request.onsuccess = () => {
        const transactions = request.result.sort((a: Transaction, b: Transaction) => 
          new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );
        resolve(transactions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync operations
  async addPendingSync(type: 'transaction' | 'product' | 'customer', data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const syncItem: PendingSync = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const request = store.put(syncItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSync(): Promise<PendingSync[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingSync'], 'readonly');
      const store = transaction.objectStore('pendingSync');
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingSync(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();
export type { CartItem, PendingSync };
