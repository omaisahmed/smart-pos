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

  // Insert products (single comprehensive list used in Karachi mega stores)
  const productsList = [
    { name: 'Kohinoor Basmati Rice 10kg', description: 'Long grain premium basmati rice', sku: 'RICE-KOH-10', category: 'Grocery', price: '14999.00', cost: '9000.00', stock: 120, imageUrl: 'https://picsum.photos/id/1010/800/600' },
    { name: 'National Atta Chakki Fresh 10kg', description: 'Whole wheat atta', sku: 'ATTA-NAT-10', category: 'Grocery', price: '6999.00', cost: '4000.00', stock: 200, imageUrl: 'https://picsum.photos/id/1011/800/600' },
    { name: 'Olpers Milk Full Cream 1L', description: 'Full cream milk UHT', sku: 'MLK-OLP-1L', category: 'Dairy', price: '250.00', cost: '140.00', stock: 500, imageUrl: 'https://picsum.photos/id/1012/800/600' },
    { name: 'Nestle Powder Milk 400g', description: 'Instant milk powder', sku: 'MIL-NES-400', category: 'Dairy', price: '1299.00', cost: '700.00', stock: 220, imageUrl: 'https://picsum.photos/id/1013/800/600' },
    { name: 'Haleeb Fresh Milk 1L', description: 'Fresh pasteurized milk', sku: 'MLK-HAL-1L', category: 'Dairy', price: '240.00', cost: '130.00', stock: 450, imageUrl: 'https://picsum.photos/id/1014/800/600' },
    { name: 'Cooking Oil (Sunflower) 5L', description: 'Refined sunflower oil', sku: 'OIL-SUN-5L', category: 'Grocery', price: '7499.00', cost: '4200.00', stock: 80, imageUrl: 'https://picsum.photos/id/1015/800/600' },
    { name: 'Good One Ghee 1kg', description: 'Pure desi ghee', sku: 'GHE-GOO-1KG', category: 'Grocery', price: '1399.00', cost: '800.00', stock: 160, imageUrl: 'https://picsum.photos/id/1016/800/600' },
    { name: 'Shezan Mango Juice 1L', description: 'Mango fruit juice', sku: 'JCE-SHZ-1L', category: 'Beverages', price: '299.00', cost: '150.00', stock: 240, imageUrl: 'https://picsum.photos/id/1017/800/600' },
    { name: 'Pepsi 1.5L', description: 'Carbonated soft drink', sku: 'SD-PEP-1.5', category: 'Beverages', price: '299.00', cost: '120.00', stock: 600, imageUrl: 'https://picsum.photos/id/1018/800/600' },
    { name: 'Coca-Cola 1.5L', description: 'Carbonated soft drink', sku: 'SD-CC-1.5', category: 'Beverages', price: '299.00', cost: '120.00', stock: 600, imageUrl: 'https://picsum.photos/id/1019/800/600' },
    { name: 'Lipton Yellow Label Tea 400g', description: 'Black tea leaves', sku: 'TEA-LIP-400', category: 'Beverages', price: '899.00', cost: '480.00', stock: 300, imageUrl: 'https://picsum.photos/id/1020/800/600' },
    { name: 'Tapal Danedar Tea 400g', description: 'Strong tea blend', sku: 'TEA-TAP-400', category: 'Beverages', price: '799.00', cost: '420.00', stock: 320, imageUrl: 'https://picsum.photos/id/1021/800/600' },
    { name: 'National Sugar 2kg', description: 'Refined sugar', sku: 'SUG-NAT-2KG', category: 'Grocery', price: '319.00', cost: '170.00', stock: 400, imageUrl: 'https://picsum.photos/id/1022/800/600' },
    { name: 'Kitchen Salt Iodized 1kg', description: 'Table salt', sku: 'SLT-KIT-1KG', category: 'Grocery', price: '59.00', cost: '30.00', stock: 900, imageUrl: 'https://picsum.photos/id/1023/800/600' },
    { name: 'Uncle Ben\'s Basmati Rice 5kg', description: 'Everyday basmati', sku: 'RICE-UNB-5', category: 'Grocery', price: '7599.00', cost: '4200.00', stock: 200, imageUrl: 'https://picsum.photos/id/1024/800/600' },
    { name: 'National Tea 250g', description: 'Loose black tea', sku: 'TEA-NAT-250', category: 'Beverages', price: '249.00', cost: '130.00', stock: 420, imageUrl: 'https://picsum.photos/id/1025/800/600' },
    { name: 'Olive Oil 500ml', description: 'Extra virgin olive oil', sku: 'OIL-OLV-500', category: 'Grocery', price: '1299.00', cost: '700.00', stock: 140, imageUrl: 'https://picsum.photos/id/1026/800/600' },
    { name: 'Mama Puffs 40g', description: 'Savory snack', sku: 'SNK-MAM-40', category: 'Snacks', price: '35.00', cost: '12.00', stock: 1500, imageUrl: 'https://picsum.photos/id/1027/800/600' },
    { name: 'Lays Classic 60g', description: 'Potato chips', sku: 'SNK-LAY-60', category: 'Snacks', price: '89.00', cost: '40.00', stock: 1200, imageUrl: 'https://picsum.photos/id/1028/800/600' },
    { name: 'Tapal Green Tea 25s', description: 'Green tea bags', sku: 'TEA-TAP-G25', category: 'Beverages', price: '249.00', cost: '120.00', stock: 360, imageUrl: 'https://picsum.photos/id/1029/800/600' },
    { name: 'Fanta 1.5L', description: 'Orange carbonated drink', sku: 'SD-FAN-1.5', category: 'Beverages', price: '299.00', cost: '120.00', stock: 300, imageUrl: 'https://picsum.photos/id/1030/800/600' },
    { name: 'Aashirvaad Salted Butter 200g', description: 'Spreadable butter', sku: 'BUT-AAS-200', category: 'Dairy', price: '359.00', cost: '200.00', stock: 220, imageUrl: 'https://picsum.photos/id/1031/800/600' },
    { name: 'Olive & Co Extra Virgin Olive Oil 1L', description: 'Premium olive oil', sku: 'OIL-OLC-1L', category: 'Grocery', price: '2499.00', cost: '1400.00', stock: 70, imageUrl: 'https://picsum.photos/id/1032/800/600' },
    { name: 'Dettol Antiseptic 250ml', description: 'Antiseptic liquid', sku: 'HMS-DET-250', category: 'Personal Care', price: '499.00', cost: '260.00', stock: 320, imageUrl: 'https://picsum.photos/id/1033/800/600' },
    { name: 'Safeguard Soap 125g', description: 'Antibacterial soap bar', sku: 'HMS-SAF-125', category: 'Personal Care', price: '129.00', cost: '60.00', stock: 800, imageUrl: 'https://picsum.photos/id/1034/800/600' },
    { name: 'Pampers Baby Diapers M 30', description: 'Disposable diapers', sku: 'BAB-PAM-M30', category: 'Baby', price: '2199.00', cost: '1200.00', stock: 120, imageUrl: 'https://picsum.photos/id/1035/800/600' },
    { name: 'Signal Toothpaste 120g', description: 'Toothpaste for cavity protection', sku: 'HMS-SIG-120', category: 'Personal Care', price: '199.00', cost: '90.00', stock: 560, imageUrl: 'https://picsum.photos/id/1036/800/600' },
    { name: 'Colgate Toothbrush', description: 'Soft bristle toothbrush', sku: 'HMS-COL-TB', category: 'Personal Care', price: '119.00', cost: '40.00', stock: 900, imageUrl: 'https://picsum.photos/id/1037/800/600' },
    { name: 'Unibic Chocolates 120g', description: 'Chocolate cookies', sku: 'CKY-UNI-120', category: 'Bakery & Confectionery', price: '249.00', cost: '120.00', stock: 400, imageUrl: 'https://picsum.photos/id/1038/800/600' },
    { name: 'Mitchells Mango Pickle 500g', description: 'Pickle', sku: 'GRO-MIT-500', category: 'Grocery', price: '399.00', cost: '180.00', stock: 220, imageUrl: 'https://picsum.photos/id/1039/800/600' },
    { name: 'Tide Detergent Powder 1kg', description: 'Laundry detergent', sku: 'HMS-TID-1KG', category: 'Household', price: '449.00', cost: '220.00', stock: 300, imageUrl: 'https://picsum.photos/id/1040/800/600' },
    { name: 'Surf Excel Liquid 1.5L', description: 'Liquid laundry detergent', sku: 'HMS-SUR-1.5L', category: 'Household', price: '899.00', cost: '480.00', stock: 180, imageUrl: 'https://picsum.photos/id/1041/800/600' },
    { name: 'Rin Bar Soap 225g', description: 'Washing bar', sku: 'HMS-RIN-225', category: 'Household', price: '119.00', cost: '50.00', stock: 600, imageUrl: 'https://picsum.photos/id/1042/800/600' },
    { name: 'Ariel Laundry Powder 2.5kg', description: 'Laundry powder', sku: 'HMS-ARI-2.5', category: 'Household', price: '1599.00', cost: '900.00', stock: 140, imageUrl: 'https://picsum.photos/id/1043/800/600' },
    { name: 'Mezan Cooking Oil 1L', description: 'Refined oil', sku: 'OIL-MEZ-1L', category: 'Grocery', price: '399.00', cost: '220.00', stock: 420, imageUrl: 'https://picsum.photos/id/1044/800/600' },
    { name: 'Safeguard Handwash 250ml', description: 'Liquid hand wash', sku: 'HMS-SAF-HW', category: 'Personal Care', price: '299.00', cost: '150.00', stock: 340, imageUrl: 'https://picsum.photos/id/1045/800/600' },
    { name: 'National Mayonnaise 400g', description: 'Creamy mayonnaise', sku: 'GRO-NAT-MAY', category: 'Grocery', price: '349.00', cost: '180.00', stock: 260, imageUrl: 'https://picsum.photos/id/1046/800/600' },
    { name: 'Chef Potato Chips 150g', description: 'Potato crisps', sku: 'SNK-CHE-150', category: 'Snacks', price: '199.00', cost: '90.00', stock: 700, imageUrl: 'https://picsum.photos/id/1047/800/600' },
    { name: 'Sufi Dates 500g', description: 'Premium dates', sku: 'GRO-DSF-500', category: 'Grocery', price: '699.00', cost: '350.00', stock: 200, imageUrl: 'https://picsum.photos/id/1048/800/600' },
    { name: 'K&N\'s Chicken Nuggets 400g', description: 'Frozen chicken nuggets', sku: 'FRO-KN-400', category: 'Frozen', price: '799.00', cost: '420.00', stock: 140, imageUrl: 'https://picsum.photos/id/1049/800/600' },
    { name: 'K&N\'s Frozen Fries 1kg', description: 'Frozen potato fries', sku: 'FRO-KNFR-1KG', category: 'Frozen', price: '699.00', cost: '360.00', stock: 120, imageUrl: 'https://picsum.photos/id/1050/800/600' },
    { name: 'Cadbury Dairy Milk 110g', description: 'Milk chocolate', sku: 'CHC-CAD-110', category: 'Confectionery', price: '199.00', cost: '90.00', stock: 600, imageUrl: 'https://picsum.photos/id/1051/800/600' },
    { name: 'Hamdard Rooh Afza 750ml', description: 'Concentrated syrup', sku: 'DRK-ROO-750', category: 'Beverages', price: '499.00', cost: '260.00', stock: 260, imageUrl: 'https://picsum.photos/id/1052/800/600' },
    { name: 'Beechams Cough Syrup 100ml', description: 'Cough relief', sku: 'MED-BEE-100', category: 'Pharmacy', price: '399.00', cost: '180.00', stock: 160, imageUrl: 'https://picsum.photos/id/1053/800/600' },
    { name: 'Sunlight Dishwash Liquid 750ml', description: 'Dishwashing liquid', sku: 'HMS-SUN-DW', category: 'Household', price: '249.00', cost: '120.00', stock: 400, imageUrl: 'https://picsum.photos/id/1054/800/600' },
    { name: 'Britannia Marie 200g', description: 'Tea biscuits', sku: 'CKY-BRI-200', category: 'Bakery & Confectionery', price: '129.00', cost: '60.00', stock: 700, imageUrl: 'https://picsum.photos/id/1055/800/600' },
    { name: 'Olive Garden Salad Dressing 250ml', description: 'Salad dressing', sku: 'GRO-OLG-250', category: 'Grocery', price: '349.00', cost: '160.00', stock: 180, imageUrl: 'https://picsum.photos/id/1056/800/600' },
    { name: 'Daal Masoor 1kg', description: 'Red lentils', sku: 'PUL-DAA-1KG', category: 'Grocery', price: '399.00', cost: '220.00', stock: 300, imageUrl: 'https://picsum.photos/id/1057/800/600' },
    { name: 'Moong Dal 1kg', description: 'Split green gram', sku: 'PUL-MOO-1KG', category: 'Grocery', price: '499.00', cost: '260.00', stock: 280, imageUrl: 'https://picsum.photos/id/1058/800/600' },
    { name: 'Soya Chunks 500g', description: 'Textured vegetable protein', sku: 'GRO-SOY-500', category: 'Grocery', price: '299.00', cost: '140.00', stock: 340, imageUrl: 'https://picsum.photos/id/1059/800/600' },
    { name: 'Fresh Chicken Whole 1kg', description: 'Loose fresh chicken per kg', sku: 'PRO-CHK-1KG', category: 'Butchery', price: '899.00', cost: '600.00', stock: 200, imageUrl: 'https://picsum.photos/id/1060/800/600' },
    { name: 'Fresh Mutton 1kg', description: 'Fresh mutton per kg', sku: 'PRO-MTN-1KG', category: 'Butchery', price: '1799.00', cost: '1200.00', stock: 80, imageUrl: 'https://picsum.photos/id/1061/800/600' },
    { name: 'Apple Royal Gala 1kg', description: 'Fresh apples per kg', sku: 'PRO-APP-1KG', category: 'Produce', price: '399.00', cost: '220.00', stock: 200, imageUrl: 'https://picsum.photos/id/1062/800/600' },
    { name: 'Banana Cavendish 1kg', description: 'Fresh bananas per kg', sku: 'PRO-BAN-1KG', category: 'Produce', price: '199.00', cost: '80.00', stock: 400, imageUrl: 'https://picsum.photos/id/1063/800/600' },
    { name: 'Tomato Local 1kg', description: 'Fresh tomatoes per kg', sku: 'PRO-TOM-1KG', category: 'Produce', price: '149.00', cost: '60.00', stock: 450, imageUrl: 'https://picsum.photos/id/1064/800/600' },
    { name: 'Onion Red 1kg', description: 'Fresh onions per kg', sku: 'PRO-ONI-1KG', category: 'Produce', price: '129.00', cost: '50.00', stock: 500, imageUrl: 'https://picsum.photos/id/1065/800/600' },
    { name: 'Garlic 250g', description: 'Fresh garlic', sku: 'PRO-GAR-250', category: 'Produce', price: '149.00', cost: '70.00', stock: 300, imageUrl: 'https://picsum.photos/id/1066/800/600' },
    { name: 'Al Kabeer Samosa 500g', description: 'Frozen samosa', sku: 'FRO-AKB-500', category: 'Frozen', price: '399.00', cost: '200.00', stock: 160, imageUrl: 'https://picsum.photos/id/1067/800/600' },
    { name: 'Maggi Noodles 5 Pack', description: 'Instant noodles', sku: 'NOO-MAG-5P', category: 'Grocery', price: '249.00', cost: '120.00', stock: 900, imageUrl: 'https://picsum.photos/id/1068/800/600' },
    { name: 'Rin Liquid 800ml', description: 'Liquid detergent', sku: 'HMS-RIN-L800', category: 'Household', price: '349.00', cost: '170.00', stock: 260, imageUrl: 'https://picsum.photos/id/1069/800/600' },
    { name: 'Almonds 250g', description: 'Roasted almonds', sku: 'NUT-ALM-250', category: 'Grocery', price: '899.00', cost: '480.00', stock: 140, imageUrl: 'https://picsum.photos/id/1070/800/600' },
    { name: 'Cashews 200g', description: 'Roasted cashews', sku: 'NUT-CAS-200', category: 'Grocery', price: '799.00', cost: '420.00', stock: 160, imageUrl: 'https://picsum.photos/id/1071/800/600' },
    { name: 'Eggs Tray (30)', description: 'Farm fresh eggs tray', sku: 'EGG-TRAY-30', category: 'Grocery', price: '699.00', cost: '350.00', stock: 180, imageUrl: 'https://picsum.photos/id/1072/800/600' },
    { name: 'Pears 1kg', description: 'Fresh pears per kg', sku: 'PRO-PEA-1KG', category: 'Produce', price: '299.00', cost: '140.00', stock: 120, imageUrl: 'https://picsum.photos/id/1073/800/600' },
    { name: 'Gillette Mach3 Razor', description: 'Men\'s razor blades', sku: 'GFT-GIL-M3', category: 'Personal Care', price: '999.00', cost: '500.00', stock: 200, imageUrl: 'https://picsum.photos/id/1074/800/600' },
    { name: 'Fair & Lovely Face Cream 50g', description: 'Skin cream', sku: 'HMS-FNL-50', category: 'Personal Care', price: '299.00', cost: '150.00', stock: 260, imageUrl: 'https://picsum.photos/id/1075/800/600' },
    { name: 'Nescafe Classic 200g', description: 'Instant coffee', sku: 'COF-NES-200', category: 'Beverages', price: '899.00', cost: '480.00', stock: 240, imageUrl: 'https://picsum.photos/id/1076/800/600' },
    { name: 'Sooper Biscuits 200g', description: 'Sweet biscuits', sku: 'CKY-SOO-200', category: 'Bakery & Confectionery', price: '139.00', cost: '60.00', stock: 700, imageUrl: 'https://picsum.photos/id/1077/800/600' },
    { name: 'Al-Khair Chapati Flour 2.5kg', description: 'All purpose atta', sku: 'ATTA-ALK-2.5', category: 'Grocery', price: '999.00', cost: '520.00', stock: 260, imageUrl: 'https://picsum.photos/id/1078/800/600' },
    { name: 'Tropicana 1L', description: 'Fruit juice', sku: 'JCE-TRP-1L', category: 'Beverages', price: '349.00', cost: '180.00', stock: 180, imageUrl: 'https://picsum.photos/id/1079/800/600' },
    { name: 'Sufi Cashew Halwa 1kg', description: 'Traditional sweet', sku: 'SWT-SFH-1KG', category: 'Bakery & Confectionery', price: '1299.00', cost: '700.00', stock: 60, imageUrl: 'https://picsum.photos/id/1080/800/600' },
  ];

  const insertedProducts: any[] = [];
  for (const p of productsList) {
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
