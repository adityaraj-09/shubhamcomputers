const PrintService = require('../models/PrintService');

// @desc    Get all print services
// @route   GET /api/print-services
exports.getPrintServices = async (req, res) => {
  try {
    const services = await PrintService.find({ isActive: true }).sort({ sortOrder: 1 });
    res.json({ success: true, services });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch print services.' });
  }
};

// @desc    Get single print service
// @route   GET /api/print-services/:id
exports.getPrintService = async (req, res) => {
  try {
    const service = await PrintService.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Print service not found.' });
    }
    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch print service.' });
  }
};

// @desc    Search print services
// @route   GET /api/print-services/search
exports.searchPrintServices = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const services = await PrintService.find({
      isActive: true,
      $or: [{ name: regex }, { description: regex }]
    }).limit(10);

    res.json({ success: true, results: services });
  } catch (error) {
    res.status(500).json({ error: 'Search failed.' });
  }
};
