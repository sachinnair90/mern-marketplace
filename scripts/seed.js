'use strict'

/**
 * Seed script — populates MongoDB with demo data.
 * Run with: node data/seed.js
 * Safe to re-run: clears existing data before inserting.
 */

const mongoose = require('mongoose')
const crypto = require('crypto')

const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_HOST ||
  'mongodb://' + (process.env.IP || 'localhost') + ':' +
  (process.env.MONGO_PORT || '27017') + '/mernproject'

// ---------------------------------------------------------------------------
// Inline schemas (mirrors the app models, no Babel/ES-module dependency)
// ---------------------------------------------------------------------------

const UserSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: 'Name is required' },
  email: { type: String, trim: true, unique: 'Email already exists', required: 'Email is required' },
  hashed_password: { type: String, required: 'Password is required' },
  salt: String,
  updated: Date,
  created: { type: Date, default: Date.now },
  seller: { type: Boolean, default: false },
  stripe_seller: {},
  stripe_customer: {}
})

const ShopSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: 'Name is required' },
  image: { data: Buffer, contentType: String },
  description: { type: String, trim: true },
  updated: Date,
  created: { type: Date, default: Date.now },
  owner: { type: mongoose.Schema.ObjectId, ref: 'User' }
})

const ProductSchema = new mongoose.Schema({
  name: { type: String, trim: true, required: 'Name is required' },
  image: { data: Buffer, contentType: String },
  description: { type: String, trim: true },
  category: String,
  quantity: { type: Number, required: 'Quantity is required' },
  price: { type: Number, required: 'Price is required' },
  updated: Date,
  created: { type: Date, default: Date.now },
  shop: { type: mongoose.Schema.ObjectId, ref: 'Shop' }
})

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.ObjectId, ref: 'Product' },
  quantity: Number,
  shop: { type: mongoose.Schema.ObjectId, ref: 'Shop' },
  status: {
    type: String,
    default: 'Not processed',
    enum: ['Not processed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
  }
})

const OrderSchema = new mongoose.Schema({
  products: [CartItemSchema],
  customer_name: { type: String, trim: true, required: 'Name is required' },
  customer_email: { type: String, trim: true, required: 'Email is required' },
  delivery_address: {
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },
  payment_id: {},
  updated: Date,
  created: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.ObjectId, ref: 'User' }
})

const AuctionSchema = new mongoose.Schema({
  itemName: { type: String, trim: true, required: 'Item name is required' },
  description: { type: String, trim: true },
  image: { data: Buffer, contentType: String },
  updated: Date,
  created: { type: Date, default: Date.now },
  bidStart: { type: Date, default: Date.now },
  bidEnd: { type: Date, required: 'Auction end time is required' },
  seller: { type: mongoose.Schema.ObjectId, ref: 'User' },
  startingBid: { type: Number, default: 0 },
  bids: [{
    bidder: { type: mongoose.Schema.ObjectId, ref: 'User' },
    bid: Number,
    time: Date
  }]
})

const User    = mongoose.model('User',    UserSchema)
const Shop    = mongoose.model('Shop',    ShopSchema)
const Product = mongoose.model('Product', ProductSchema)
const Order   = mongoose.model('Order',   OrderSchema)
const Auction = mongoose.model('Auction', AuctionSchema)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashPassword(password) {
  const salt = String(Math.round(new Date().valueOf() * Math.random()))
  const hashed = crypto.createHmac('sha1', salt).update(password).digest('hex')
  return { salt, hashed_password: hashed }
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const USERS = [
  { name: 'Alice Seller',  email: 'alice@demo.com',  password: 'password123', seller: true  },
  { name: 'Bob Seller',    email: 'bob@demo.com',    password: 'password123', seller: true  },
  { name: 'Carol Buyer',   email: 'carol@demo.com',  password: 'password123', seller: false },
  { name: 'David Buyer',   email: 'david@demo.com',  password: 'password123', seller: false },
]

// shops[i].ownerIndex → index into USERS array
const SHOPS = [
  { name: 'Alice\'s Electronics', description: 'Quality gadgets and consumer electronics at great prices.', ownerIndex: 0 },
  { name: 'Alice\'s Bookstore',   description: 'Fiction, non-fiction, and everything in between.',          ownerIndex: 0 },
  { name: 'Bob\'s Sports Gear',   description: 'Everything you need for an active lifestyle.',             ownerIndex: 1 },
]

// products[i].shopIndex → index into SHOPS array
const PRODUCTS = [
  // Alice's Electronics
  { name: 'Wireless Headphones', description: 'Noise-cancelling over-ear headphones with 30h battery life.', category: 'Electronics', quantity: 50, price: 79.99, shopIndex: 0 },
  { name: 'Mechanical Keyboard', description: 'TKL layout with Cherry MX switches and RGB backlight.',       category: 'Electronics', quantity: 30, price: 129.00, shopIndex: 0 },
  { name: 'USB-C Hub 7-in-1',    description: 'HDMI 4K, 3× USB-A, SD card reader, 100W PD charging.',       category: 'Electronics', quantity: 80, price: 39.99, shopIndex: 0 },
  { name: 'Smart LED Desk Lamp', description: 'Touch-dimming, 5 colour temperatures, USB charging port.',   category: 'Electronics', quantity: 45, price: 34.99, shopIndex: 0 },

  // Alice's Bookstore
  { name: 'Clean Code',               description: 'Robert C. Martin\'s guide to writing maintainable software.', category: 'Books', quantity: 25, price: 34.99, shopIndex: 1 },
  { name: 'The Pragmatic Programmer', description: 'From journeyman to master — Hunt & Thomas classic.',          category: 'Books', quantity: 20, price: 39.99, shopIndex: 1 },
  { name: 'Designing Data-Intensive Applications', description: 'Martin Kleppmann on reliable, scalable systems.', category: 'Books', quantity: 15, price: 49.99, shopIndex: 1 },
  { name: 'Atomic Habits',            description: 'James Clear on tiny changes with remarkable results.',        category: 'Books', quantity: 40, price: 17.99, shopIndex: 1 },

  // Bob's Sports Gear
  { name: 'Yoga Mat Pro',         description: 'Non-slip 6mm thick mat, eco-friendly TPE material.',          category: 'Sports', quantity: 60, price: 29.99, shopIndex: 2 },
  { name: 'Resistance Band Set',  description: 'Set of 5 bands (10–50 lb) with carry bag and door anchor.',   category: 'Sports', quantity: 100, price: 19.99, shopIndex: 2 },
  { name: 'Adjustable Dumbbell', description: 'Single dumbbell adjustable from 5 to 52.5 lb in 2.5 lb steps.', category: 'Sports', quantity: 20, price: 299.00, shopIndex: 2 },
  { name: 'Running Water Bottle', description: '500 ml BPA-free bottle with flip-top lid and carry loop.',    category: 'Sports', quantity: 150, price: 12.99, shopIndex: 2 },
]

// auctions — seller is USERS[0] (Alice) and USERS[1] (Bob)
const AUCTIONS_DEF = [
  {
    itemName: 'Vintage Camera Collection',
    description: 'A set of 3 classic 35mm film cameras from the 1970s in working condition.',
    startingBid: 150,
    bidEnd: daysFromNow(5),
    sellerIndex: 0
  },
  {
    itemName: 'Signed First-Edition Novel',
    description: 'Signed first edition of a bestselling debut novel, near-mint condition.',
    startingBid: 80,
    bidEnd: daysFromNow(3),
    sellerIndex: 0
  },
  {
    itemName: 'Professional Road Bike',
    description: 'Carbon fibre road bike, barely used, size 54cm. Includes pedals and helmet.',
    startingBid: 500,
    bidEnd: daysFromNow(7),
    sellerIndex: 1
  },
]

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  console.log(`Connecting to ${MONGO_URI} …`)
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  console.log('Connected.')

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Shop.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Auction.deleteMany({}),
  ])
  console.log('Cleared existing collections.')

  // Create users
  const users = await User.insertMany(
    USERS.map(u => {
      const { salt, hashed_password } = hashPassword(u.password)
      return { name: u.name, email: u.email, seller: u.seller, salt, hashed_password }
    })
  )
  console.log(`Created ${users.length} users.`)

  // Create shops
  const shops = await Shop.insertMany(
    SHOPS.map(s => ({
      name: s.name,
      description: s.description,
      owner: users[s.ownerIndex]._id
    }))
  )
  console.log(`Created ${shops.length} shops.`)

  // Create products
  const products = await Product.insertMany(
    PRODUCTS.map(p => ({
      name: p.name,
      description: p.description,
      category: p.category,
      quantity: p.quantity,
      price: p.price,
      shop: shops[p.shopIndex]._id
    }))
  )
  console.log(`Created ${products.length} products.`)

  // Create a sample order for Carol (users[2])
  const carol = users[2]
  await Order.create({
    customer_name: carol.name,
    customer_email: 'carol@demo.com',
    delivery_address: { street: '42 Elm Street', city: 'Springfield', state: 'IL', zipcode: '62701', country: 'US' },
    products: [
      { product: products[0]._id, quantity: 1, shop: shops[0]._id, status: 'Delivered' },
      { product: products[4]._id, quantity: 2, shop: shops[1]._id, status: 'Shipped' },
    ],
    user: carol._id
  })
  console.log('Created 1 sample order.')

  // Create auctions (with a couple of bids from buyers)
  const david = users[3]
  for (const def of AUCTIONS_DEF) {
    await Auction.create({
      itemName: def.itemName,
      description: def.description,
      startingBid: def.startingBid,
      bidEnd: def.bidEnd,
      bidStart: new Date(),
      seller: users[def.sellerIndex]._id,
      bids: [
        { bidder: carol._id, bid: def.startingBid + 10, time: new Date() },
        { bidder: david._id, bid: def.startingBid + 25, time: new Date() },
      ]
    })
  }
  console.log(`Created ${AUCTIONS_DEF.length} auctions.`)

  console.log('\nSeed complete! Demo accounts:')
  USERS.forEach(u => console.log(`  ${u.email}  /  ${u.password}  (seller: ${u.seller})`))
}

seed()
  .then(() => mongoose.disconnect())
  .catch(err => { console.error(err); process.exit(1) })
