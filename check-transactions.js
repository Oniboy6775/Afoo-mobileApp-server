require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./Models/transactionModel');

async function checkTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const count = await Transaction.countDocuments({});
    console.log(`Total transactions: ${count}`);
    
    if (count > 0) {
      const sample = await Transaction.findOne({});
      console.log('Sample transaction:');
      console.log(JSON.stringify(sample, null, 2));
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTransactions();
