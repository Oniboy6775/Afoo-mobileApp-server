const createTask = (req, res) => {
  res.send("task created");
};
const deleteTask = (req, res) => {
  res.send("task deleted");
};
const completeTask = (req, res) => {
  res.send("task completed");
};
const editTask = (req, res) => {
  res.send("task deleted");
};
const fetchTask = (req, res) => {
  res.send("task fetched");
};
module.exports = {
  createTask,
  deleteTask,
  completeTask,
  editTask,
  fetchTask,
};
