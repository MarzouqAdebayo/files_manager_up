import {ObjectId} from 'mongodb';

export default function getIdObject(id: string) {
  try {
    const idObject = new ObjectId(id);
    return idObject;
  } catch (error) {
    console.error(error);
    return null;
  }
}
