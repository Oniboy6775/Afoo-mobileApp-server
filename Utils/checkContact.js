const Contact = require("../Models/contactModel");
const checkContact = async ({ contactNumber, userId, contactNetwork }) => {
  const contactToUpdate = await Contact.findOne({
    userId,
    contactNumber,
    contactNetwork,
  });
  if (!contactToUpdate) return;
  await Contact.updateOne(
    { _id: contactToUpdate._id },
    { $set: { createdAt: Date.now() } }
  );
};
module.exports = checkContact;
