/* eslint-disable n/no-unpublished-import */
import {spec} from 'pactum';
import {like} from 'pactum-matchers';
import {dbClient} from '../src/utils/db';
import * as argon from 'argon2';

const testEmail = 'test@email.com';
const testPassword = '12345678';

describe('Auth Route Endpoints', () => {
  let token = '';
  beforeAll(async () => {
    const hshpwd = await argon.hash(testPassword);
    await dbClient.userCollection.insertOne({
      email: testEmail,
      password: hshpwd,
    });
  });

  afterAll(async () => {
    await dbClient.userCollection.findOneAndDelete({email: testEmail});
    await dbClient.close();
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
  }, 10000);

  it('GET /disconnect', async () => {
    await spec()
      .get('http://localhost:5000/disconnect')
      .withHeaders('X-Token', `auth_${token}`)
      .expectStatus(204);
  }, 10000);
});
