/**
 * This module defines the routes for the API using Express.
 * It sets up the endpoints for 'status' and 'stats' using the methods
 * from the `AppController` to handle the respective requests.
 */
//import AppController from '../controllers/AppController';

import {Express} from 'express';
import AppController from '../controllers/AppController';
import UserController from '../controllers/UserController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = (app: Express) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
  app.post('/users', UserController.postNew);
};

export default router;
