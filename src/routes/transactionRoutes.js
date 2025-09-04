const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const verifyFirebaseToken = require("../middleware/firebaseAuth");

// ✅ Transactions
router.get("/", verifyFirebaseToken, transactionController.getAll);
router.get("/:id", verifyFirebaseToken, transactionController.getOne);
router.post("/", verifyFirebaseToken, transactionController.create);

module.exports = router;
