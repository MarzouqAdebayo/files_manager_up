/* eslint-disable n/no-unpublished-import */
import {spec} from 'pactum';
import {like} from 'pactum-matchers';

describe('App Route Endpoints', () => {
  it('GET /status', async () => {
    await spec()
      .get('http://localhost:5000/status')
      .expectStatus(200)
      .expectJson({redis: true, db: true});
  }, 10000);

  it('GET /stats', async () => {
    await spec()
      .get('http://localhost:5000/stats')
      .expectStatus(200)
      .expectJsonMatch({users: like(1), files: like(5)});
  }, 10000);
});
