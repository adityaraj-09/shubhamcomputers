require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../models/Category');

const CATEGORIES = [
  { name: 'All Stationery',  icon: '🗂️',  sortOrder: 0  },
  { name: 'Pens',            icon: '🖊️',  sortOrder: 1  },
  { name: 'Notebooks',       icon: '📒',  sortOrder: 2  },
  { name: 'Planners',        icon: '📅',  sortOrder: 3  },
  { name: 'Pencils',         icon: '✏️',  sortOrder: 4  },
  { name: 'Erasers',         icon: '🧹',  sortOrder: 5  },
  { name: 'Sharpeners',      icon: '🔧',  sortOrder: 6  },
  { name: 'Sticky Notes',    icon: '🗒️',  sortOrder: 7  },
  { name: 'Memo Pads',       icon: '📄',  sortOrder: 8  },
  { name: 'Calendars',       icon: '📆',  sortOrder: 9  },
  { name: 'Highlighters',    icon: '🖍️',  sortOrder: 10 },
  { name: 'Rulers',          icon: '📏',  sortOrder: 11 },
  { name: 'To-do Lists',     icon: '✅',  sortOrder: 12 },
  { name: 'Journals',        icon: '📔',  sortOrder: 13 },
  { name: 'Bookmarks',       icon: '🔖',  sortOrder: 14 },
  { name: 'Kits',            icon: '🛄',  sortOrder: 15 },
  { name: 'Notepads',        icon: '🗓️',  sortOrder: 16 },
  { name: 'Geometry Sets',   icon: '📐',  sortOrder: 17 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  let added = 0, skipped = 0;

  for (const cat of CATEGORIES) {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const exists = await Category.findOne({ slug });
    if (exists) {
      console.log(`  ⏭  Skipped (already exists): ${cat.name}`);
      skipped++;
    } else {
      await Category.create({ ...cat, slug });
      console.log(`  ➕ Added: ${cat.name}`);
      added++;
    }
  }

  console.log(`\nDone — ${added} added, ${skipped} skipped.`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
