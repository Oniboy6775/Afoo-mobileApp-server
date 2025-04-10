require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./Models/transactionModel');

async function testGetTransactions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Simulate the getTransactions controller function
    const transactions = await Transaction.find({}).sort("-createdAt");
    console.log(`Retrieved ${transactions.length} transactions`);
    
    if (transactions.length > 0) {
      console.log('First transaction:');
      console.log(JSON.stringify(transactions[0], null, 2));
    } else {
      console.log('No transactions found');
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testGetTransactions();
