const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    restaurantName: String,
    items: [
      {
        menuItemId: String,
        name: String,
        price: Number,
        qty: Number,
      },
    ],
    address: { label: String, line: String, landmark: String, phone: String },
    paymentMethod: { type: String, enum: ['COD', 'UPI', 'CARD'], default: 'COD' },
    bill: {
      subtotal: Number,
      deliveryFee: Number,
      tax: Number,
      discount: Number,
      total: Number,
      coupon: String,
    },
    status: {
      type: String,
      enum: ['placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'placed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
