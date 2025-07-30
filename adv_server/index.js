import express from 'express';
import orders from './routes/orders.js';
import secret from './routes/secret.js';
import update from './routes/update.js';
import list_orders from "./routes/list_orders.js";
import resolver from "./routes/resolver.js";

const app = express();
app.use(express.json());
app.use('/orders', orders);
app.use('/secret', secret);
app.use('/update', update);
app.use('/list', list_orders);
app.use('/resolver', resolver);

app.get('/health', (req, res) => {
    res.json({status: "ok"});
})

app.listen(4000, () => console.log('Relayer API on http://localhost:4000'));