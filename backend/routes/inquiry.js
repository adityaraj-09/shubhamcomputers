const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const auth = require('../middleware/auth');

// POST /api/inquiry — submit an enquiry (public)
router.post('/', async (req, res) => {
  try {
    const { name, phone, requirements, quantity } = req.body;

    if (!name || !phone || !requirements) {
      return res.status(400).json({ message: 'Name, phone, and requirements are required' });
    }

    const phoneClean = String(phone).replace(/\s+/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      return res.status(400).json({ message: 'Invalid phone number' });
    }

    const inquiry = await Inquiry.create({
      name: String(name).trim().slice(0, 100),
      phone: phoneClean,
      requirements: String(requirements).trim().slice(0, 2000),
      quantity: quantity ? String(quantity).trim().slice(0, 200) : '',
    });

    res.status(201).json({ message: 'Enquiry received. We will contact you soon!', id: inquiry._id });
  } catch (err) {
    console.error('Inquiry POST error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/inquiry — admin: list all enquiries
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    console.error('Inquiry GET error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/inquiry/:id/status — admin: update status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { status } = req.body;
    if (!['new', 'contacted', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!inquiry) return res.status(404).json({ message: 'Enquiry not found' });
    res.json(inquiry);
  } catch (err) {
    console.error('Inquiry PATCH error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
