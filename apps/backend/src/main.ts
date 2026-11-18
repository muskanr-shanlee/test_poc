import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../auth.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const fastify = app.getHttpAdapter().getInstance();

  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const headers = fromNodeHeaders(request.headers);

      const url = new URL(
        request.url,
        `http://${request.headers.host}`,
      );

      const req = new Request(url, {
        method: request.method,
        headers,
        ...(request.body
          ? { body: JSON.stringify(request.body) }
          : {}),
      });

      const response = await auth.handler(req);

      reply.status(response.status);

      response.headers.forEach((value, key) => {
        reply.header(key, value);
      });

      reply.send(response.body ? await response.text() : null);
    },
  });

  await app.listen(3000, '0.0.0.0');
}

await bootstrap();
