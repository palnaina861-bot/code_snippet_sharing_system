const express = require('express')
const userRouter = require('./routers/UserRouter');
const ProductRouter = require('./routers/ProductRouter');

const app = express();

const port = 5000;

//middleware
app.use('/user', userRouter);
//middleware
app.use('/Product', ProductRouter);



//endPoint or route
app.get('/', (req,res) => {
    res.send('response from express');
});

//getall
app.get('/getall', (req,res) => {
    res.send('response from getall');
});

//delete
app.get('/delete', (req,res) => {
    res.send('response from delete');
});

//update
app.get('/update', (req,res) => {
    res.send('response from update');
});

app.listen(port, () => {
    console.log('server started'); 
});