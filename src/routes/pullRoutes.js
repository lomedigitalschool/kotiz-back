const express = require("express");
const router = express.Router();
const pullController = require("../controllers/pullController");
const verifyFirebaseToken = require("../middleware/firebaseAuth");
const multer = require("multer");
const path = require("path");

// 📂 Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Dossier où stocker les images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont autorisées"), false);
    }
  },
});

// 🛠️ Routes Pull
router.post("/", verifyFirebaseToken, upload.single("image"), pullController.create); // créer un pull
router.get("/", pullController.getAll); // liste des pulls
router.get("/:id", pullController.getOne); // détail d’un pull
router.put("/:id", verifyFirebaseToken, pullController.update); // modifier
router.delete("/:id", verifyFirebaseToken, pullController.remove); // supprimer

module.exports = router;
