import {RequestHandler} from 'express';
import {dbClient} from '../utils/db';
import {redisClient} from '../utils/redis';

const getStatus: RequestHandler = (req, res) => {
  res.status(200).json({redis: redisClient.isAlive(), db: dbClient.isAlive()});
};

const getStats: RequestHandler = async (req, res) => {
  res
    .status(200)
    .json({users: await dbClient.nbUsers(), files: await dbClient.nbFiles()});
};

export default {getStatus, getStats};
