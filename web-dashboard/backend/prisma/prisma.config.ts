// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { defineConfig } from '@prisma/integration';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  datasource: {
    provider: 'mongodb',
    url: process.env.MONGODB_URI,
  },
});
