const express = require("express");
const {
  fetchTask,
  createTask,
  deleteTask,
  editTask,
  completeTask,
} = require("../Controllers/taskController");
const router = express.Router();

router.route("/").get(fetchTask).post(createTask);
router.route("/:id").get().delete(deleteTask).patch(editTask);
router.route("/:id/complete").post(completeTask);
module.exports = router;
