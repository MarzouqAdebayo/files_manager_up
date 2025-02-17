/**
 * This module defines the routes for the API using Express.
 * It sets up the endpoints for 'status' and 'stats' using the methods
 * from the `AppController` to handle the respective requests.
 */
import {Express} from 'express';
import AppController from '../controllers/AppController';
import UserController from '../controllers/UserController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = (app: Express) => {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  app.get('/connect', AuthController.getConnect);
  app.get(
    '/disconnect',
    AuthController.authMiddleware,
    AuthController.getDisconnect,
  );

  app.post('/users', UserController.postNew);
  app.get('/users/me', AuthController.authMiddleware, UserController.getMe);

  app.post('/files', AuthController.authMiddleware, FilesController.postUpload);
  app.get('/files/:id', AuthController.authMiddleware, FilesController.getShow);
  app.get('/files', AuthController.authMiddleware, FilesController.getIndex);
  app.put(
    '/files/:id/publish',
    AuthController.authMiddleware,
    FilesController.putPublish,
  );
  app.put(
    '/files/:id/unpublish',
    AuthController.authMiddleware,
    FilesController.putUnpublish,
  );
  app.get('/files/:id/data', FilesController.getFile);
};

export default router;
