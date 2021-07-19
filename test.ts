import { getJSONFromSQLQuery } from "./lib/database.ts";

console.log(getJSONFromSQLQuery("SELECT * FROM polls"));
