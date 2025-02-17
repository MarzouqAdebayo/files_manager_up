import {RequestHandler} from 'express';
import {dbClient} from '../utils/db';
import * as argon from 'argon2';
import {redisClient} from '../utils/redis';
import {sendWelcomeEmailQueue} from '../email-worker';
import getIdObject from '../utils/getIdObject';

const postNew: RequestHandler = async (req, res) => {
  const {email, password} = req.body;
  if (!email) {
    res.status(400).json({error: 'Missing email'});
    return;
  }
  if (!password) {
    res.status(400).json({error: 'Missing password'});
    return;
  }
  const emailExists = await dbClient.userCollection.findOne({email});
  if (emailExists) {
    res.status(400).json({error: 'Already exists'});
    return;
  }
  const hashedPassword = await argon.hash(password);
  const createdUser = await dbClient.userCollection.insertOne({
    email,
    password: hashedPassword,
  });
  res.status(200).json({id: createdUser.insertedId, email});
  void sendWelcomeEmailQueue.add({recipients: email});
};

const getMe: RequestHandler = async (req, res) => {
  const token = req.headers['x-token'] || req.cookies['token'];
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
    res.status(404).json({error: 'Invalid user id'});
    return;
  }
  const userExists = await dbClient.userCollection.findOne({
    _id: mongoObjectId,
  });
  if (!userExists) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  res
    .status(200)
    .json({id: userExists._id.toString(), email: userExists.email});
};

export default {postNew, getMe};
