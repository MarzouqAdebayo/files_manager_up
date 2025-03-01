/* eslint-disable n/no-unpublished-import */
import {spec} from 'pactum';
import {like} from 'pactum-matchers';
import {dbClient} from '../src/utils/db';
import {redisClient} from '../src/utils/redis';
import {sendWelcomeEmailQueue} from '../src/email-worker';

const testEmail = 'test@email.com';
const testPassword = '12345678';

describe('User Route Endpoints', () => {
  let token = '';
  let userId = '';
  beforeAll(async () => {
    await sendWelcomeEmailQueue.empty();
  });

  afterAll(async () => {
    await redisClient.remove(`auth_${token}`);
    await redisClient.close();
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

  it('GET /users/me', async () => {
    await spec()
      .get('http://localhost:5000/users/me')
      .withHeaders('X-Token', `auth_${token}`)
      .expectStatus(200)
      .expectJsonMatch({id: like('sjfh'), email: testEmail});
  });

  it('GET /users/me Unauthorized', async () => {
    await spec()
      .get('http://localhost:5000/users/me')
      .withHeaders('X-Token', `auth_${token}38`)
      .expectStatus(401)
      .expectJson({error: 'Unauthorized'});
  });
});
