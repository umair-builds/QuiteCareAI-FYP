const express = require('express');
const router = express.Router();

// Skeleton Routes (We will add real logic later)
router.post('/signup', (req, res) => {
  res.json({ message: "Signup route working" });
});

router.post('/signin', (req, res) => {
  res.json({ message: "Signin route working" });
});

module.exports = router;