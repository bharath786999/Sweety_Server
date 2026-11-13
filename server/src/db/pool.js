const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const isLocalDatabase = /^postgres(?:ql)?:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/])/i.test(connectionString || '');

const pool = new Pool({
    connectionString,
    ssl: isLocalDatabase ? false : {
        rejectUnauthorized: false
    },
    max: 5
});

module.exports = pool;