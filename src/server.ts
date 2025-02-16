import * as express from 'express';
import router from './routes';
import * as cors from 'cors';
import * as dotenv from 'dotenv';

// Loading env vars
dotenv.config();

const app = express();
app.use(express.json({limit: '50mb'}));
app.use(cors());

app.get('/', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  res.json({message: 'Hello World!'});
});
router(app);
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  },
);

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`server listening on ${HOST}:${PORT}`);
});
