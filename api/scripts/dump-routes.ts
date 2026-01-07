import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function dumpRoutes() {
  try {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.init();

    const server = app.getHttpAdapter().getInstance();
    const router = server._router;

    if (router && router.stack) {
      router.stack.forEach((layer: any) => {
        if (layer.route) {
          const path = layer.route.path;
          const methods = Object.keys(layer.route.methods).map((m) =>
            m.toUpperCase(),
          );
          methods.forEach((m) => console.log(`${m} ${path}`));
        }
      });
    } else {
      // Different express version?
      const stack =
        server.stack ||
        (server._events &&
          server._events.request &&
          server._events.request._router &&
          server._events.request._router.stack);
      if (stack) {
        stack.forEach((layer: any) => {
          if (layer.route) {
            const path = layer.route.path;
            const methods = Object.keys(layer.route.methods).map((m) =>
              m.toUpperCase(),
            );
            methods.forEach((m) => console.log(`${m} ${path}`));
          }
        });
      }
    }

    await app.close();
  } catch (e) {
    console.error(e);
  }
}

dumpRoutes();
