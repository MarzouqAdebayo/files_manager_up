import {RequestHandler} from 'express';
import {dbClient} from '../utils/db';
import * as argon from 'argon2';
import {redisClient} from '../utils/redis';
import {ObjectId} from 'mongodb';
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
};

export default {postNew, getMe};
