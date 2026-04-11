const Product = require('../models/Product');
const Category = require('../models/Category');

// @desc    Get all products (with filters, search, pagination)
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = { isActive: true };

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Brand filter
    if (req.query.brand) {
      filter.brand = req.query.brand;
    }

    // Sort
    let sort = {};
    switch (req.query.sort) {
      case 'price_low': sort = { price: 1 }; break;
      case 'price_high': sort = { price: -1 }; break;
      case 'newest': sort = { createdAt: -1 }; break;
      case 'popular': sort = { isFeatured: -1, createdAt: -1 }; break;
      default: sort = { isFeatured: -1, createdAt: -1 };
    }

    const products = await Product.find(filter)
      .populate('category', 'name slug icon')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug icon');
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
};

// @desc    Get all categories
// @route   GET /api/products/categories/all
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

// @desc    Search products (fast autocomplete)
// @route   GET /api/products/search/quick
exports.quickSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: regex },
        { tags: regex },
        { brand: regex }
      ]
    })
      .select('name price image category slug')
      .populate('category', 'name')
      .limit(10);

    res.json({ success: true, results: products });
  } catch (error) {
    res.status(500).json({ error: 'Search failed.' });
  }
};
