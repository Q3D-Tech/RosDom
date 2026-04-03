import { JwtService } from '@nestjs/jwt';
import { DemoService } from './demo.service';
import { RealtimeService } from '../realtime/realtime.service';

describe('DemoService', () => {
  let service: DemoService;

  beforeEach(() => {
    service = new DemoService(
      new JwtService(),
      {
        get: (key: string) =>
          key === 'JWT_ACCESS_SECRET' ? 'rosdom-access' : undefined,
      } as never,
      {
        publish: jest.fn(),
      } as unknown as RealtimeService,
    );
  });

  it('returns the same command for a repeated idempotency key', () => {
    const login = service.login('alexey@rosdom.local', 'rosdom-demo');
    const user = service.authenticateSession(login.sessionId, login.user.id);
    const home = service.getHomesForUser(user.id)[0];
    const device = service.getDevices(home.id, user.id)[0];

    const first = service.submitCommand(user, device.id, 'idem-1', {
      capabilityKey: 'power',
      requestedValue: true,
    });
    const second = service.submitCommand(user, device.id, 'idem-1', {
      capabilityKey: 'power',
      requestedValue: true,
    });

    expect(first.id).toBe(second.id);
  });

  it('rejects overlapping layout blocks', () => {
    const login = service.login('alexey@rosdom.local', 'rosdom-demo');
    const user = service.authenticateSession(login.sessionId, login.user.id);
    const home = service.getHomesForUser(user.id)[0];
    const rooms = service.getRooms(home.id, user.id);

    expect(() =>
      service.replaceLayout(user.id, home.id, {
        revision: home.layoutRevision,
        blocks: [
          { roomId: rooms[0].id, x: 0, y: 0, width: 3, height: 3, zIndex: 0 },
          { roomId: rooms[1].id, x: 2, y: 0, width: 3, height: 3, zIndex: 0 },
        ],
        items: [],
      }),
    ).toThrow('Layout blocks cannot overlap');
  });
});
