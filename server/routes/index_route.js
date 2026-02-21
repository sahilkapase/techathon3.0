const express = require('express');
const router = express.Router();

router.use('/farmer', require('./farmer/farmer_route'));

router.use('/admin', require('./admin/admin_route'));

router.use('/scheme', require('./scheme/scheme_route'));

router.use('/district', require('./district/district_route'));

//here it is use to get existing data of crop 
router.use('/area', require('./crop_existing/crop_existing_route'))

//here we get new system to get data
router.use('/cropdata', require('./crop_data/crop_data_route'));

router.use('/farm', require('./farm/farm_route'));

router.use('/expert', require('./expert/expert'));

router.use('/trader', require('./trader/trader_route'));

router.use('/APMC', require('./APMC/APMC_route'));

router.use('/training', require('./training/training_route'))

router.use('/insurance', require('./insurance_company/insurance_company'));

// AI Chatbot Route
router.use('/chatbot', require('./chatbot/chatbot_route'));

// AS-4: Farmer Financial Support (Schemes, Insurance, Financial Aid)
router.use('/financial', require('./financial/farmer_financial_route'));

// Smart Farmer Scheme Assistant
router.use('/smart-assistant', require('./smart_assistant/smart_assistant_route'));

router.get('/', function (req, res) {
    return res.send('Hello');
});
module.exports = router;