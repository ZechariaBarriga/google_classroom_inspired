import { Pool } from "pg";

const pool = new Pool({
   host: "localhost",
   port: 5432,
   user: "postgres",
   password: "user",
   database: "restapi"
});

export default pool;



