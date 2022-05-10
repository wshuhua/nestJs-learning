export default () => ({
  environmoent: process.env.NODE_ENV || "development",
  database: {
    host: process.env.DATABASE_HOST,
    post: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  },
});
