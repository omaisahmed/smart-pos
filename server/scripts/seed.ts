import 'dotenv/config';
import { db } from '../db';
import {
  users,
  products,
  customers,
  transactions,
  transactionItems,
  inventoryMovements,
} from '@shared/schema';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Starting seeder...');

  // ensure at least one user exists
  let [existingUser] = await db.select().from(users).limit(1);
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('password', 10);
    const [newUser] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: 'admin@local.dev',
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'Admin',
        role: 'admin',
      })
      .returning();
    existingUser = newUser;
    console.log('Created seed user:', existingUser.email);
  } else {
    console.log('Found existing user:', existingUser.email);
  }

  // Insert products
  const sampleProducts = [
    { name: 'Coffee Beans', description: 'Premium roasted coffee', sku: 'COF-001', category: 'Beverages', price: '499.00', cost: '250.00', stock: 100, imageUrl: 'https://picsum.photos/id/1011/800/600' },
    { name: 'Milk (1L)', description: 'Fresh milk', sku: 'MLK-001', category: 'Dairy', price: '150.00', cost: '80.00', stock: 200, imageUrl: 'https://picsum.photos/id/1012/800/600' },
    { name: 'Bread Loaf', description: 'Whole grain bread', sku: 'BRD-001', category: 'Bakery', price: '120.00', cost: '60.00', stock: 150, imageUrl: 'https://picsum.photos/id/1025/800/600' },
    { name: 'Orange Juice', description: 'Fresh squeezed orange juice', sku: 'OJ-001', category: 'Beverages', price: '220.00', cost: '120.00', stock: 80, imageUrl: 'https://picsum.photos/id/1035/800/600' },
    { name: 'Blue Pen', description: 'Ballpoint pen', sku: 'PEN-001', category: 'Stationery', price: '30.00', cost: '10.00', stock: 500, imageUrl: 'https://picsum.photos/id/1060/800/600' },
    { name: 'Chocolate Bar', description: 'Dark chocolate 70%', sku: 'CHO-001', category: 'Snacks', price: '85.00', cost: '40.00', stock: 300, imageUrl: 'https://picsum.photos/id/1080/800/600' },
    { name: 'Mineral Water (500ml)', description: 'Pure mineral water', sku: 'WTR-001', category: 'Beverages', price: '40.00', cost: '15.00', stock: 1000, imageUrl: 'https://picsum.photos/id/1084/800/600' },
    { name: 'Notebook A5', description: 'Ruled notebook A5', sku: 'NTB-001', category: 'Stationery', price: '120.00', cost: '50.00', stock: 250, imageUrl: 'https://picsum.photos/id/1074/800/600' },
    { name: 'T-Shirt', description: 'Cotton t-shirt, size M', sku: 'TSH-001', category: 'Clothing', price: '899.00', cost: '400.00', stock: 60, imageUrl: 'https://picsum.photos/id/1027/800/600' },
    { name: 'Wireless Mouse', description: '2.4GHz wireless mouse', sku: 'MSE-001', category: 'Electronics', price: '1299.00', cost: '700.00', stock: 80, imageUrl: 'https://picsum.photos/id/1050/800/600' },
  ];

  // Additional products to reach a larger sample set
  const extraProducts = [
    { name: 'Headphones', description: 'Over-ear Bluetooth headphones', sku: 'HPH-001', category: 'Electronics', price: '2499.00', cost: '1200.00', stock: 60, imageUrl: 'https://picsum.photos/id/1040/800/600' },
    { name: 'USB-C Cable', description: 'Fast charging USB-C cable', sku: 'USB-001', category: 'Electronics', price: '299.00', cost: '80.00', stock: 400, imageUrl: 'https://picsum.photos/id/1032/800/600' },
    { name: 'Cereal Box', description: 'Healthy mixed grain cereal', sku: 'CER-001', category: 'Grocery', price: '320.00', cost: '150.00', stock: 220, imageUrl: 'https://picsum.photos/id/1005/800/600' },
    { name: 'Green Tea Pack', description: 'Green tea bags 25pcs', sku: 'TEA-001', category: 'Beverages', price: '199.00', cost: '90.00', stock: 180, imageUrl: 'https://picsum.photos/id/1020/800/600' },
    { name: 'Hand Soap', description: 'Liquid hand soap 250ml', sku: 'SOAP-001', category: 'Personal Care', price: '89.00', cost: '35.00', stock: 350, imageUrl: 'https://picsum.photos/id/1015/800/600' },
    { name: 'Shampoo', description: 'Herbal shampoo 400ml', sku: 'SHP-001', category: 'Personal Care', price: '299.00', cost: '140.00', stock: 140, imageUrl: 'https://picsum.photos/id/1018/800/600' },
    { name: 'Toothbrush', description: 'Soft bristle toothbrush', sku: 'TBR-001', category: 'Personal Care', price: '49.00', cost: '12.00', stock: 600, imageUrl: 'https://picsum.photos/id/1024/800/600' },
    { name: 'Toothpaste', description: 'Fluoride toothpaste 100g', sku: 'TTH-001', category: 'Personal Care', price: '149.00', cost: '60.00', stock: 320, imageUrl: 'https://picsum.photos/id/1022/800/600' },
    { name: 'Eggs (Dozen)', description: 'Fresh farm eggs, dozen', sku: 'EGG-001', category: 'Grocery', price: '240.00', cost: '120.00', stock: 200, imageUrl: 'https://picsum.photos/id/1028/800/600' },
    { name: 'Butter Pack', description: 'Salted butter 200g', sku: 'BUT-001', category: 'Dairy', price: '310.00', cost: '150.00', stock: 160, imageUrl: 'https://picsum.photos/id/1038/800/600' },
  ];

  const insertedProducts: any[] = [];
  for (const p of sampleProducts) {
    const values = {
      ...p,
      price: String(p.price),
      cost: p.cost ? String(p.cost) : undefined,
    } as any;

    // upsert by SKU to avoid duplicate key errors when running the seeder multiple times
    const [upserted] = await db.insert(products)
      .values(values)
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          ...values,
          updatedAt: new Date(),
        },
      })
      .returning();

    insertedProducts.push(upserted);
  }
  console.log('Upserted products:', insertedProducts.map(p => p.name).join(', '));

  // Upsert extra products as well
  for (const p of extraProducts) {
    const values = {
      ...p,
      price: String(p.price),
      cost: p.cost ? String(p.cost) : undefined,
    } as any;

    const [upserted] = await db.insert(products)
      .values(values)
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          ...values,
          updatedAt: new Date(),
        },
      })
      .returning();

    insertedProducts.push(upserted);
  }
  console.log('Upserted extra products:', extraProducts.map(p => p.name).join(', '));

  // Insert customers
  const sampleCustomers = [
    { name: 'Ali Khan', email: 'ali@example.com', phone: '+92-300-1111111', address: 'Clifton, Karachi' },
    { name: 'Sara Ahmed', email: 'sara@example.com', phone: '+92-300-2222222', address: 'DHA, Karachi' },
  ];

  const insertedCustomers: any[] = [];
  for (const c of sampleCustomers) {
    // try to find existing by email
    const [existingCust] = await db.select().from(customers).where(eq(customers.email, c.email));
    if (existingCust) {
      insertedCustomers.push(existingCust);
    } else {
      const [newCust] = await db.insert(customers).values({
        ...c,
        creditBalance: '0',
        totalPurchases: '0',
      }).returning();
      insertedCustomers.push(newCust);
    }
  }
  console.log('Upserted customers:', insertedCustomers.map(c => c.name).join(', '));

  // Create a sample transaction for the first customer and two products
  const productA = insertedProducts[0];
  const productB = insertedProducts[1];
  const customer = insertedCustomers[0];

  const subtotal = (parseFloat(productA.price) * 2 + parseFloat(productB.price) * 1).toFixed(2);
  const tax = (parseFloat(subtotal) * 0.17).toFixed(2);
  const total = (parseFloat(subtotal) + parseFloat(tax)).toFixed(2);

  const transactionPayload = {
    transactionNumber: `TXN-${Date.now()}`,
    customerId: customer.id,
    userId: existingUser.id,
    subtotal: String(subtotal),
    tax: String(tax),
    total: String(total),
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    synced: false,
  };

  await db.transaction(async (tx) => {
    const [createdTransaction] = await tx.insert(transactions).values(transactionPayload).returning();

    const items = [
      {
        transactionId: createdTransaction.id,
        productId: productA.id,
        quantity: 2,
        unitPrice: String(productA.price),
        totalPrice: (parseFloat(productA.price) * 2).toFixed(2),
      },
      {
        transactionId: createdTransaction.id,
        productId: productB.id,
        quantity: 1,
        unitPrice: String(productB.price),
        totalPrice: String(productB.price),
      },
    ];

    await tx.insert(transactionItems).values(items);

    // reduce stock for products
    await tx.update(products).set({ stock: productA.stock - 2 }).where(eq(products.id, productA.id));
    await tx.update(products).set({ stock: productB.stock - 1 }).where(eq(products.id, productB.id));

    // record inventory movements
    await tx.insert(inventoryMovements).values([
      {
        productId: productA.id,
        type: 'out',
        quantity: 2,
        previousStock: productA.stock,
        newStock: productA.stock - 2,
        reason: 'Seed sale',
        userId: existingUser.id,
      },
      {
        productId: productB.id,
        type: 'out',
        quantity: 1,
        previousStock: productB.stock,
        newStock: productB.stock - 1,
        reason: 'Seed sale',
        userId: existingUser.id,
      },
    ]);

    console.log('Created sample transaction:', createdTransaction.transactionNumber);
  });

  console.log('Seeding complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
