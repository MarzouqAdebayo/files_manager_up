/* eslint-disable n/no-unpublished-import */
import {spec} from 'pactum';
import {like} from 'pactum-matchers';
import {dbClient} from '../src/utils/db';
import {redisClient} from '../src/utils/redis';
import {thumbnailGeneratorQueue} from '../src/image-worker';
import * as fs from 'fs';
import {sendWelcomeEmailQueue} from '../src/email-worker';

const testEmail = 'test@email.com';
const testPassword = '1to8';

describe('Files Route Endpoints', () => {
  let token = '';
  let userId = '';
  let parentId = '';
  let imageFileId = '';
  beforeAll(async () => {
    await thumbnailGeneratorQueue.empty();
  });

  afterAll(async () => {
    await redisClient.remove(`auth_${token}`);
    await redisClient.close();
    await thumbnailGeneratorQueue.close();
    await sendWelcomeEmailQueue.close();
    await dbClient.userCollection.findOneAndDelete({email: testEmail});
    await dbClient.close();
  });

  it('POST /users', async () => {
    userId = await spec()
      .post('http://localhost:5000/users')
      .withHeaders(
        'Authorization',
        'Basic ' + btoa(testEmail + ':' + testPassword),
      )
      .withBody({email: testEmail, password: testPassword})
      .expectStatus(200)
      .expectJsonMatch({id: like('sjfh'), email: testEmail})
      .returns(ctx => (ctx.res.json as {id: string}).id ?? '');
    const jobs = await sendWelcomeEmailQueue.getJobs([
      'waiting',
      'active',
      'completed',
    ]);
    expect(jobs.length).toBeGreaterThan(0);

    const job = jobs[0];
    expect(job.data).toMatchObject({email: testEmail, userId});
  });

  it('GET /connect', async () => {
    token = await spec()
      .get('http://localhost:5000/connect')
      .withHeaders(
        'Authorization',
        'Basic ' + btoa(testEmail + ':' + testPassword),
      )
      .expectStatus(200)
      .expectJsonMatch({token: like('sjfh')})
      .returns(ctx => (ctx.res.json as {token: string}).token ?? '');
  });

  it('POST /files upload folder with missing name', async () => {
    await spec()
      .post('http://localhost:5000/files')
      .withHeaders('X-Token', `auth_${token}`)
      .withBody({
        type: 'folder',
        parentId: 0,
        isPublic: false,
        data: '',
      })
      .expectStatus(400)
      .expectJsonMatch({error: 'Missing name'});
  });

  it('POST /files upload file with missing data', async () => {
    await spec()
      .post('http://localhost:5000/files')
      .withHeaders('X-Token', `auth_${token}`)
      .withBody({
        name: 'empty_file',
        type: 'file',
        parentId: 0,
        isPublic: false,
      })
      .expectStatus(400)
      .expectJsonMatch({error: 'Missing data'});
  });

  it('POST /files upload folder', async () => {
    parentId = await spec()
      .post('http://localhost:5000/files')
      .withHeaders('X-Token', `auth_${token}`)
      .withBody({
        name: 'root_folder',
        type: 'folder',
        parentId: 0,
        isPublic: false,
        data: '',
      })
      .expectStatus(201)
      .expectJsonMatch({
        id: like('fjsdlfjsdl'),
        userId,
        name: 'test_root_folder',
        type: 'folder',
        isPublic: false,
        parentId: 0,
        localPath: '',
      })
      .returns(ctx => (ctx.res.json as {id: string}).id);
  });

  it.skip('POST /files upload image', async () => {
    const fileContent = fs.readFileSync('../assets/test_image_1.png');
    const data = fileContent.toString('base64');
    imageFileId = await spec()
      .post('http://localhost:5000/files')
      .withHeaders('X-Token', `auth_${token}`)
      .withBody({
        name: 'e2e_image_test.png',
        type: 'image',
        parentId,
        isPublic: false,
        data,
      })
      .expectStatus(201)
      .expectJsonMatch({
        id: like('fjsdlfjsdl'),
        userId,
        name: 'e2e_image_test.png',
        type: 'image',
        parentId,
        isPublic: false,
        localPath: like('ajfldsjfljodfsj'),
      })
      .returns(ctx => (ctx.res.json as {id: string}).id);
    const jobs = await sendWelcomeEmailQueue.getJobs([
      'waiting',
      'active',
      'completed',
    ]);
    expect(jobs.length).toBeGreaterThan(0);

    const job = jobs[0];
    expect(job.data).toMatchObject({fileId: imageFileId, userId});
  });
});
