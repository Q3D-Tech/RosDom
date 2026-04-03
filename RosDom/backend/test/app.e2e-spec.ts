import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from './../src/common/http/all-exceptions.filter';
import { RequestIdMiddleware } from './../src/common/http/request-id.middleware';

jest.setTimeout(30000);

describe('RosDom Backend (e2e)', () => {
  let app: INestApplication;
  let httpServer: Parameters<typeof request>[0];
  let accessToken = '';
  let homeId = '';
  let roomIds: string[] = [];
  let scenarioId = '';
  const suffix = Date.now().toString();
  const loginIdentifier = `adult-${suffix}@rosdom.test`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(new RequestIdMiddleware().use);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('v1');
    await app.init();
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const registerResponse = await request(httpServer)
      .post('/v1/auth/register')
      .send({
        loginIdentifier,
        identifierType: 'email',
        password: 'RosDom-Password-123',
        name: 'Алексей',
        birthYear: 1990,
        deviceName: 'Backend e2e',
      })
      .expect(201);
    const registerBody = registerResponse.body as {
      data: { accessToken: string };
    };
    accessToken = registerBody.data.accessToken;

    await request(httpServer)
      .post('/v1/families')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Семья e2e' })
      .expect(201);

    const homeResponse = await request(httpServer)
      .post('/v1/homes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Дом e2e',
        addressLabel: 'Якутск',
        timezone: 'Asia/Yakutsk',
      })
      .expect(201);
    const homeBody = homeResponse.body as { data: { id: string } };
    homeId = homeBody.data.id;

    const kitchenResponse = await request(httpServer)
      .post(`/v1/homes/${homeId}/rooms`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Кухня',
        type: 'kitchen',
        sortOrder: 0,
      })
      .expect(201);

    const hallResponse = await request(httpServer)
      .post(`/v1/homes/${homeId}/rooms`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Коридор',
        type: 'hallway',
        sortOrder: 1,
      })
      .expect(201);

    roomIds = [
      (kitchenResponse.body as { data: { id: string } }).data.id,
      (hallResponse.body as { data: { id: string } }).data.id,
    ];
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves public health', async () => {
    const response = await request(httpServer).get('/v1/health').expect(200);
    const body = response.body as { data: { status: string } };
    expect(body.data.status).toBe('ok');
  });

  it('returns a home snapshot', async () => {
    const response = await request(httpServer)
      .get(`/v1/homes/${homeId}/snapshot`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const body = response.body as {
      data: { home: { id: string }; rooms: unknown[] };
    };

    expect(body.data.home.id).toBe(homeId);
    expect(body.data.rooms.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects overlapping layout blocks', async () => {
    const snapshot = await request(httpServer)
      .get(`/v1/homes/${homeId}/snapshot`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const snapshotBody = snapshot.body as {
      data: {
        home: { layoutRevision: number };
      };
    };

    await request(httpServer)
      .put(`/v1/homes/${homeId}/layouts`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        revision: snapshotBody.data.home.layoutRevision,
        blocks: [
          { roomId: roomIds[0], x: 0, y: 0, width: 3, height: 3, zIndex: 0 },
          { roomId: roomIds[1], x: 2, y: 0, width: 3, height: 3, zIndex: 0 },
        ],
        items: [],
      })
      .expect(409);
  });

  it('creates and runs a scenario with automation history', async () => {
    const createScenarioResponse = await request(httpServer)
      .post('/v1/scenarios')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        homeId,
        title: 'Ночной режим',
        description: 'Перевод дома в ночной режим',
        iconKey: 'moon',
        executionMode: 'manual',
      })
      .expect(201);

    scenarioId = (createScenarioResponse.body as { data: { id: string } }).data
      .id;

    const runResponse = await request(httpServer)
      .post(`/v1/scenarios/${scenarioId}/run`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    const runBody = runResponse.body as { data: { status: string } };

    expect(runBody.data.status).toBe('queued');

    const automationsResponse = await request(httpServer)
      .get('/v1/automations/runs')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ homeId })
      .expect(200);
    const automationsBody = automationsResponse.body as {
      data: Array<{ scenarioId: string }>;
    };

    expect(
      automationsBody.data.some((item) => item.scenarioId === scenarioId),
    ).toBe(true);
  });
});
