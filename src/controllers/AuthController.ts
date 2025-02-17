import {RequestHandler} from 'express';
import {dbClient} from '../utils/db';
import * as argon from 'argon2';
import {v4 as uuidv4} from 'uuid';
import {redisClient} from '../utils/redis';
import getIdObject from '../utils/getIdObject';

const getConnect: RequestHandler = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
  const [email, password] = decoded.split(':');
  const userExists = await dbClient.userCollection.findOne({email});
  if (!userExists) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  const passwordConfirmed = await argon.verify(userExists.password, password);
  if (!passwordConfirmed) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  const token = uuidv4();
  const cache_key = `auth_${token}`;
  const lifetime = 24 * 60 * 60 * 1000;
  await redisClient.set(cache_key, userExists._id.toString(), lifetime);
  res.cookie('token', `auth_${token}`, {
    maxAge: lifetime || 3600000,
    sameSite: 'lax',
    httpOnly: true,
    secure: false,
    priority: 'high',
  });
  res.status(200).json({token: token});
};

const getDisconnect: RequestHandler = async (req, res) => {
  const token = req.headers['x-token'];
  if (!token || typeof token !== 'string') {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  const userId = await redisClient.get(token);
  if (!userId) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  const mongoObjectId = getIdObject(userId);
  if (!mongoObjectId) {
    res.status(400).json({error: 'Invalid user id'});
    return;
  }
  const userExists = await dbClient.userCollection.findOne({
    _id: mongoObjectId,
  });
  if (!userExists) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  await redisClient.remove(token);
  res.clearCookie('token');
  res.status(204);
};

const authMiddleware: RequestHandler = async (req, res, next) => {
  const token = req.headers['x-token'] || req.cookies['token'];
  if (!token || typeof token !== 'string') {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  const userId = await redisClient.get(token);
  if (!userId) {
    res.status(404).json({error: 'Unauthorized'});
    return;
  }
  res.locals.user = {id: userId};
  next();
};

export default {getConnect, getDisconnect, authMiddleware};
