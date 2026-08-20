import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: {
    kind: 'single',
    filePath: 'prisma/schema.prisma'
  },
  migrations: {
    url: 'file:./dev.db'
  }
});
