import {RequestHandler} from 'express';
import {redisClient} from '../utils/redis';
import {dbClient} from '../utils/db';
import * as path from 'path';
import * as fs from 'fs/promises';
import {v4 as uuidv4} from 'uuid';
import * as mime from 'mime-types';
import {pathExists} from '../utils/fileUtils';
import {thumbnailGeneratorQueue} from '../image-worker';
import getIdObject from '../utils/getIdObject';
import {saveBase64File} from '../utils/base64Utils';

enum FileType {
  Folder = 'folder',
  File = 'file',
  Image = 'image',
}

const postUpload: RequestHandler = async (req, res) => {
  const userId = res.locals.user.id as string;
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
    const mongoObjectId = getIdObject(parentId);
    if (!mongoObjectId) {
      res.status(400).json({error: 'Invalid parent id'});
      return;
    }
    const parentFolder = await dbClient.fileCollection.findOne({
      _id: mongoObjectId,
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
    const folder = await dbClient.fileCollection.insertOne(doc);
    res.status(201).json({...doc, id: folder.insertedId.toString()});
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
    await saveBase64File(data, filepath);
    doc.localPath = filepath;
    const newFile = await dbClient.fileCollection.insertOne(doc);
    res.status(201).json({...doc, id: newFile.insertedId.toString()});
    if (doc.type === FileType.Image) {
      void thumbnailGeneratorQueue.add({
        fileId: newFile.insertedId.toString(),
        userId,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({error: 'internal server error'});
  }
};

const getShow: RequestHandler = async (req, res) => {
  const userId = res.locals.user.id as string;
  const {id: fileId} = req.params;
  const mongoObjectId = getIdObject(fileId);
  if (!mongoObjectId) {
    res.status(404).json({error: 'Invalid file id'});
    return;
  }
  const file = await dbClient.fileCollection.findOne({
    _id: mongoObjectId,
    userId,
  });
  if (!file) {
    res.status(404).json({error: 'Not found'});
    return;
  }
  if (file.type === FileType.Folder) {
    res.status(400).json({error: "A folder doesn't have content"});
    return;
  }
  res.status(200).json(file);
};

const getIndex: RequestHandler = async (req, res) => {
  const userId = res.locals.user.id as string;
  const {parentId = 0, page = 1} = req.query;
  const pageToInt =
    typeof page === 'string' && parseInt(page) ? parseInt(page) : 1;
  const limit = 5;
  const skip = (pageToInt - 1) * limit;
  const files = await dbClient.fileCollection
    .find(
      {
        parentId,
        userId,
      },
      {limit, skip},
    )
    .toArray();
  res.status(200).json(files);
};

const putPublish: RequestHandler = async (req, res) => {
  const userId = res.locals.user.id as string;
  const {id} = req.params;
  const mongoObjectId = getIdObject(id);
  if (!mongoObjectId) {
    res.status(404).json({error: 'Unauthorized'});
    return;
  }
  const updatedFile = await dbClient.fileCollection.findOneAndUpdate(
    {_id: mongoObjectId, userId},
    {$set: {isPublic: true}},
  );
  if (!updatedFile) {
    res.status(404).json({error: 'Not found'});
    return;
  }
  updatedFile.isPublic = true;
  res.status(200).json(updatedFile);
};

const putUnpublish: RequestHandler = async (req, res) => {
  const userId = res.locals.user.id as string;
  const {id} = req.params;
  const mongoObjectId = getIdObject(id);
  if (!mongoObjectId) {
    res.status(404).json({error: 'Invalid file id'});
    return;
  }
  const updatedFile = await dbClient.fileCollection.findOneAndUpdate(
    {_id: mongoObjectId, userId},
    {$set: {isPublic: false}},
  );
  if (!updatedFile) {
    res.status(404).json({error: 'Not found'});
    return;
  }
  updatedFile.isPublic = false;
  res.status(200).json(updatedFile);
};

const getFile: RequestHandler = async (req, res) => {
  const {id} = req.params;
  const {size} = req.query;
  const mongoObjectId = getIdObject(id);
  if (!mongoObjectId) {
    res.status(404).json({error: 'Invalid file id'});
    return;
  }
  const file = await dbClient.fileCollection.findOne({_id: mongoObjectId});
  if (!file) {
    res.status(404).json({error: 'Invalid file id'});
    return;
  }
  if (!file.isPublic) {
    const token = req.cookies['token'] || req.headers['x-token'];
    if (!token || typeof token !== 'string') {
      res.status(401).json({error: 'Unauthorized'});
      return;
    }
    const userId = await redisClient.get(token);
    if (!userId) {
      res.status(404).json({error: 'Unauthorized'});
      return;
    }
    if (userId !== file.userId) {
      res.status(404).json({error: 'Not found'});
      return;
    }
  }
  if (file.type === FileType.Folder) {
    res.status(400).json({error: "A folder doesn't have content"});
    return;
  }
  let localPath = file.localPath;
  if (size) {
    localPath = `${localPath}_${size}`;
  }
  if (!(await pathExists(localPath))) {
    res.status(404).json({error: 'Not found'});
    return;
  }
  const contents = await fs.readFile(localPath);
  const mimeType = mime.lookup(file.name);
  res.type(mimeType || 'text/plain');
  res.status(200).end(contents);
};

export default {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
  getFile,
};
