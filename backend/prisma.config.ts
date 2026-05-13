import { config } from 'dotenv';

config();

export default {
  earlyAccess: true,
  migrate: {
    url: process.env.DATABASE_URL,
  },
};
