const express = require('express')

const router = express();

router.get('/add', (req, res) => {
    res.send('response from user add product');
});

//getall
router.get('/getall', (req, res) => {
    res.send('response from user getall product');
});

//getbyid
router.get('/getbyid', (req, res) => {
    res.send('response from user getbyid product');
});

module.exports = router;