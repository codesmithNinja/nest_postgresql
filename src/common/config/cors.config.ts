export const allowedOrigins: (string | undefined)[] = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.API_URL,
  process.env.SECURED_WHITELIST_SITE_URL,
  process.env.UNSECURED_WHITELIST_SITE_URL,
  process.env.SECURED_WHITELIST_ADMIN_URL,
  process.env.UNSECURED_WHITELIST_ADMIN_URL,
];

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // No PUT method
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-API-Key',
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};
