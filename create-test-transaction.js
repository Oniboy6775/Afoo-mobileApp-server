require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('./Models/transactionModel');
const { v4: uuid } = require('uuid');

async function createTestTransaction() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create a test transaction
    const testTransaction = new Transaction({
      trans_Id: uuid(),
      trans_By: 'test-user-id',
      trans_Type: 'test',
      trans_Network: 'TEST',
      phone_number: '1234567890',
      trans_amount: 100,
      balance_Before: 1000,
      balance_After: 900,
      trans_Date: `${new Date().toDateString()} ${new Date().toLocaleTimeString()}`,
      trans_Status: 'success',
      createdAt: Date.now()
    });
    
    // Save the test transaction
    const savedTransaction = await testTransaction.save();
    console.log('Test transaction created:');
    console.log(JSON.stringify(savedTransaction, null, 2));
    
    // Verify it can be retrieved
    const count = await Transaction.countDocuments({});
    console.log(`Total transactions after adding test: ${count}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestTransaction();
