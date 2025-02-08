const pushNotificationModel = require("../Models/pushNotificationModel");
const { sendPushNotification } = require("../Utils/expo/notification");

const addPushToken = async (req, res) => {
  const { pushToken } = req.body;
  const { userId } = req.user;
  console.log(pushToken);
  // ExponentPushToken[0TMSfQC_FSh9VlkmAfJrpw]
  try {
    if (!pushToken || !userId)
      return res.status(400).json("All field are  required");
    // const pushTokenExist = await pushNotificationModel.findOne({
    //   userId,
    // });
    await pushNotificationModel.deleteOne({ userId });
    await pushNotificationModel.deleteOne({ pushToken });
    await pushNotificationModel.create({ userId, pushToken });

    res.status(200).json({ msg: "Push token added" });
  } catch (error) {
    res.status(500).json({ msg: "An error occur" });
  }
};
const sendNotifications = async (req, res) => {
  const { title, body, userId } = req.body;
  const pushTokens = [];
  try {
    if (userId) {
      // Only one user
      const user = await pushNotificationModel.find({ userId: userId });
      pushTokens.push(user.pushToken);
      // console.log(user);
    } else {
      // All users
      const usersToken = await pushNotificationModel.find({
        pushIsActive: true,
      });
      usersToken.forEach((element) => {
        pushTokens.push(element.pushToken);
      });
      // console.log(user);
    }
    sendPushNotification({ title, body, data: {}, pushTokens });
    res.status(200).json({ msg: "Notification sent" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "An error occur" });
  }
};
module.exports = { addPushToken, sendNotifications };
