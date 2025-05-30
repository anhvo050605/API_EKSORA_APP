const express = require('express');
const router = express.Router();
const optionController = require('../controllers/optionServiceController');

router.get('/', optionController.getOptionsByService); // Lấy theo service_id
router.post('/', optionController.createOption);
router.put('/:id', optionController.updateOption);
router.delete('/:id', optionController.deleteOption);

module.exports = router;
