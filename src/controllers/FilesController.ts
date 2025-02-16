import {RequestHandler} from 'express';
import {redisClient} from '../utils/redis';
import {dbClient} from '../utils/db';
import * as path from 'path';
import * as fs from 'fs/promises';
import {v4 as uuidv4} from 'uuid';
import {ObjectId} from 'mongodb';
import {pathExists} from '../utils/fileUtils';
enum FileType {
  Folder = 'folder',
  File = 'file',
  Image = 'image',
const postUpload: RequestHandler = async (req, res) => {
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
  const {name, type, parentId = 0, isPublic = false, data} = req.body;
  if (!name) {
    res.status(400).json({error: 'Missing name'});
    return;
  }
  if (!type || !Object.values(FileType).includes(type)) {
    res.status(400).json({error: 'Missing type'});
    return;
  }
  if (type !== FileType.Folder && !data) {
    res.status(400).json({error: 'Missing data'});
    return;
  }
  if (parentId) {
    const parentFolder = await dbClient.fileCollection.findOne({
      id: parentId,
    });
    if (!parentFolder) {
      res.status(400).json({error: 'Parent not found'});
      return;
    }
    if (parentFolder.type !== FileType.Folder) {
      res.status(400).json({error: 'Parent is not a folder'});
      return;
    }
  }
  const doc = {
    userId,
    name,
    type,
    isPublic,
    parentId: parentId || 0,
    localPath: '',
  };
  if (type === FileType.Folder) {
    await dbClient.fileCollection.insertOne(doc);
    res.status(201).json(doc);
    return;
  }
  const dirPath = path.join(
    process.cwd(),
    process.env.FOLDER_PATH || '/tmp/files_manager',
  );
  if (!(await pathExists(dirPath))) {
    await fs.mkdir(dirPath, {recursive: true});
  }
  try {
    const filepath = path.join(dirPath, uuidv4());
    await fs.writeFile(filepath, data);
    doc.localPath = filepath;
    const newFile = await dbClient.fileCollection.insertOne(doc);
    res.status(201).json(doc);
  } catch (error) {
    console.log(error);
    res.status(500).json({error: 'internal server error'});
  }
};

