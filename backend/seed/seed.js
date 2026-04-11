require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const PrintService = require('../models/PrintService');

const connectDB = require('../config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Clear existing data
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      PrintService.deleteMany({})
    ]);

    // Create admin user
    let adminUser = await User.findOne({ phone: '9999999999' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Shubham Admin',
        phone: '9999999999',
        role: 'admin'
      });
      console.log('✅ Admin user created (phone: 9999999999)');
    }

    // Seed Print Services
    const printServices = await PrintService.insertMany([
      {
        name: 'B&W Print',
        icon: '🖨️',
        description: 'Black & white document printing on A4 paper',
        basePrice: 2,
        sortOrder: 1,
        options: {
          sizeOptions: [
            { label: 'A4', priceMultiplier: 1 },
            { label: 'A3', priceMultiplier: 2 },
            { label: 'Legal', priceMultiplier: 1.5 }
          ],
          sidesOptions: [
            { label: 'Single Side', priceMultiplier: 1 },
            { label: 'Both Sides', priceMultiplier: 1.7 }
          ],
          paperOptions: [
            { label: 'Normal (75 GSM)', priceMultiplier: 1 },
            { label: 'Premium (100 GSM)', priceMultiplier: 1.5 }
          ]
        }
      },
      {
        name: 'Color Print',
        icon: '🌈',
        description: 'Full color document printing',
        basePrice: 5,
        sortOrder: 2,
        options: {
          sizeOptions: [
            { label: 'A4', priceMultiplier: 1 },
            { label: 'A3', priceMultiplier: 2.5 }
          ],
          sidesOptions: [
            { label: 'Single Side', priceMultiplier: 1 },
            { label: 'Both Sides', priceMultiplier: 1.8 }
          ],
          paperOptions: [
            { label: 'Normal', priceMultiplier: 1 },
            { label: 'Glossy', priceMultiplier: 2 },
            { label: 'Matte', priceMultiplier: 1.8 }
          ]
        }
      },
      {
        name: 'Photo Print',
        icon: '📸',
        description: 'High quality photo printing',
        basePrice: 10,
        sortOrder: 3,
        options: {
          sizeOptions: [
            { label: 'Passport Size', priceMultiplier: 0.5 },
            { label: '4x6 inch', priceMultiplier: 1 },
            { label: '5x7 inch', priceMultiplier: 1.5 },
            { label: '8x10 inch', priceMultiplier: 3 },
            { label: 'A4', priceMultiplier: 4 }
          ],
          paperOptions: [
            { label: 'Glossy', priceMultiplier: 1 },
            { label: 'Matte', priceMultiplier: 1.2 }
          ]
        }
      },
      {
        name: 'ID Card',
        icon: '🪪',
        description: 'PVC ID card printing with lamination',
        basePrice: 50,
        sortOrder: 4,
        requiresFile: true,
        options: {
          sidesOptions: [
            { label: 'Single Side', priceMultiplier: 1 },
            { label: 'Both Sides', priceMultiplier: 1.5 }
          ]
        }
      },
      {
        name: 'Visiting Card',
        icon: '💳',
        description: 'Professional visiting/business cards',
        basePrice: 200,
        sortOrder: 5,
        options: {
          paperOptions: [
            { label: 'Standard (300 GSM)', priceMultiplier: 1 },
            { label: 'Premium (350 GSM)', priceMultiplier: 1.5 },
            { label: 'Glossy Laminated', priceMultiplier: 2 },
            { label: 'Matte Laminated', priceMultiplier: 2 }
          ]
        }
      },
      {
        name: 'Banner / Flex',
        icon: '🏗️',
        description: 'Large format banner and flex printing',
        basePrice: 15,
        sortOrder: 6,
        options: {
          sizeOptions: [
            { label: 'Per sq ft', priceMultiplier: 1 },
            { label: '3x2 ft', priceMultiplier: 6 },
            { label: '4x3 ft', priceMultiplier: 12 },
            { label: '6x3 ft', priceMultiplier: 18 }
          ],
          colorOptions: [
            { label: 'Full Color', priceMultiplier: 1 },
            { label: 'Economy', priceMultiplier: 0.7 }
          ]
        }
      },
      {
        name: 'Spiral Binding',
        icon: '📒',
        description: 'Document spiral binding with cover',
        basePrice: 30,
        sortOrder: 7,
        options: {
          bindingOptions: [
            { label: 'Plastic Spiral', price: 30 },
            { label: 'Metal Spiral', price: 50 },
            { label: 'Comb Binding', price: 25 }
          ]
        }
      },
      {
        name: 'Lamination',
        icon: '✨',
        description: 'Document and photo lamination',
        basePrice: 10,
        sortOrder: 8,
        options: {
          sizeOptions: [
            { label: 'ID Size', priceMultiplier: 0.5 },
            { label: 'A4', priceMultiplier: 1 },
            { label: 'A3', priceMultiplier: 2 }
          ]
        }
      },
      {
        name: 'Photocopy',
        icon: '📄',
        description: 'Quick photocopy service',
        basePrice: 1,
        sortOrder: 9,
        options: {
          sizeOptions: [
            { label: 'A4', priceMultiplier: 1 },
            { label: 'A3', priceMultiplier: 2 },
            { label: 'Legal', priceMultiplier: 1.5 }
          ],
          sidesOptions: [
            { label: 'Single Side', priceMultiplier: 1 },
            { label: 'Both Sides', priceMultiplier: 1.5 }
          ]
        }
      }
    ]);
    console.log(`✅ ${printServices.length} print services created`);

    // Seed Categories
    const categories = await Category.insertMany([
      { name: 'Pens & Pencils', icon: '🖊️', sortOrder: 1 },
      { name: 'Notebooks & Registers', icon: '📓', sortOrder: 2 },
      { name: 'Files & Folders', icon: '📁', sortOrder: 3 },
      { name: 'Art Supplies', icon: '🎨', sortOrder: 4 },
      { name: 'Office Supplies', icon: '📎', sortOrder: 5 },
      { name: 'School Supplies', icon: '🎒', sortOrder: 6 },
      { name: 'Paper Products', icon: '📃', sortOrder: 7 },
      { name: 'Computer Accessories', icon: '💻', sortOrder: 8 }
    ]);
    console.log(`✅ ${categories.length} categories created`);

    // Seed Products
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c._id; });

    const products = await Product.insertMany([
      // Pens & Pencils
      { name: 'Cello Butterflow Ball Pen (Blue)', category: catMap['Pens & Pencils'], price: 10, mrp: 12, stock: 100, unit: 'piece', brand: 'Cello', tags: ['pen', 'ball pen', 'blue'] },
      { name: 'Classmate Octane Gel Pen (Pack of 5)', category: catMap['Pens & Pencils'], price: 75, mrp: 85, stock: 50, unit: 'pack', brand: 'Classmate', tags: ['gel pen', 'pack'], isFeatured: true },
      { name: 'Natraj Pencil HB (Pack of 10)', category: catMap['Pens & Pencils'], price: 30, mrp: 40, stock: 80, unit: 'pack', brand: 'Natraj', tags: ['pencil', 'hb'] },
      { name: 'Pilot V5 (Black)', category: catMap['Pens & Pencils'], price: 45, mrp: 50, stock: 40, unit: 'piece', brand: 'Pilot', tags: ['pen', 'black', 'premium'] },
      { name: 'Doms Erasers (Pack of 5)', category: catMap['Pens & Pencils'], price: 15, mrp: 20, stock: 60, unit: 'pack', brand: 'Doms', tags: ['eraser'] },

      // Notebooks & Registers
      { name: 'Classmate Notebook - 180 Pages', category: catMap['Notebooks & Registers'], price: 45, mrp: 55, stock: 100, unit: 'piece', brand: 'Classmate', tags: ['notebook', 'ruled'], isFeatured: true },
      { name: 'Classmate Register - 300 Pages', category: catMap['Notebooks & Registers'], price: 85, mrp: 100, stock: 50, unit: 'piece', brand: 'Classmate', tags: ['register', 'large'] },
      { name: 'Spiral Notebook A5 - 200 Pages', category: catMap['Notebooks & Registers'], price: 60, mrp: 70, stock: 70, unit: 'piece', brand: 'Classmate', tags: ['spiral', 'notebook'] },
      { name: 'Long Notebook A4 - 400 Pages', category: catMap['Notebooks & Registers'], price: 120, mrp: 150, stock: 30, unit: 'piece', brand: 'Classmate', tags: ['long', 'register'] },

      // Files & Folders
      { name: 'Clear File Folder A4 (20 Pockets)', category: catMap['Files & Folders'], price: 35, mrp: 45, stock: 80, unit: 'piece', tags: ['file', 'clear', 'folder'] },
      { name: 'Box File (Lever Arch)', category: catMap['Files & Folders'], price: 70, mrp: 90, stock: 40, unit: 'piece', tags: ['box file', 'lever arch'] },
      { name: 'Spring File (Pack of 5)', category: catMap['Files & Folders'], price: 50, mrp: 60, stock: 60, unit: 'pack', tags: ['spring file'] },

      // Art Supplies
      { name: 'Camel Water Colors - 12 Shades', category: catMap['Art Supplies'], price: 60, mrp: 75, stock: 40, unit: 'set', brand: 'Camel', tags: ['water colors', 'painting'], isFeatured: true },
      { name: 'Faber Castell Color Pencils - 24 Shades', category: catMap['Art Supplies'], price: 150, mrp: 180, stock: 30, unit: 'set', brand: 'Faber Castell', tags: ['color pencils'] },
      { name: 'Drawing Sheet A3 (Pack of 20)', category: catMap['Art Supplies'], price: 40, mrp: 50, stock: 50, unit: 'pack', tags: ['drawing sheet', 'art'] },

      // Office Supplies
      { name: 'Stapler with Pins', category: catMap['Office Supplies'], price: 80, mrp: 100, stock: 30, unit: 'piece', tags: ['stapler'] },
      { name: 'Sticky Notes (3x3 inch, 100 Sheets)', category: catMap['Office Supplies'], price: 30, mrp: 40, stock: 100, unit: 'pad', tags: ['sticky notes', 'post it'] },
      { name: 'Tape Dispenser + 2 Rolls', category: catMap['Office Supplies'], price: 50, mrp: 65, stock: 40, unit: 'set', tags: ['tape', 'dispenser'] },
      { name: 'Paper Clips (Box of 100)', category: catMap['Office Supplies'], price: 15, mrp: 20, stock: 80, unit: 'box', tags: ['paper clips'] },
      { name: 'Scissors (6 inch)', category: catMap['Office Supplies'], price: 25, mrp: 35, stock: 50, unit: 'piece', tags: ['scissors'] },

      // School Supplies
      { name: 'Geometry Box (9 piece set)', category: catMap['School Supplies'], price: 80, mrp: 100, stock: 40, unit: 'set', tags: ['geometry', 'compass', 'school'] },
      { name: 'School Bag - Medium', category: catMap['School Supplies'], price: 350, mrp: 450, stock: 20, unit: 'piece', tags: ['bag', 'school bag'], isFeatured: true },

      // Paper Products
      { name: 'A4 Paper Ream (500 Sheets)', category: catMap['Paper Products'], price: 250, mrp: 300, stock: 50, unit: 'ream', tags: ['a4', 'paper', 'ream'], isFeatured: true },
      { name: 'A3 Paper (100 Sheets)', category: catMap['Paper Products'], price: 200, mrp: 250, stock: 30, unit: 'pack', tags: ['a3', 'paper'] },
      { name: 'Chart Paper (Pack of 10)', category: catMap['Paper Products'], price: 40, mrp: 50, stock: 60, unit: 'pack', tags: ['chart paper', 'colored'] },

      // Computer Accessories
      { name: 'USB Flash Drive 32GB', category: catMap['Computer Accessories'], price: 250, mrp: 350, stock: 25, unit: 'piece', tags: ['usb', 'pen drive', 'flash drive'], isFeatured: true },
      { name: 'Mouse Pad', category: catMap['Computer Accessories'], price: 80, mrp: 120, stock: 30, unit: 'piece', tags: ['mouse pad'] },
      { name: 'OTG Adapter (Type-C)', category: catMap['Computer Accessories'], price: 100, mrp: 150, stock: 40, unit: 'piece', tags: ['otg', 'adapter', 'type-c'] },
    ]);
    console.log(`✅ ${products.length} products created`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('Admin Login: Phone 9999999999');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedData();
