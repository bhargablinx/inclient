import "dotenv/config";
import { validateEnv } from "./utils/validateEnv.js";

// Validate env vars before connecting to DB or booting app
validateEnv();

import connectDB from "./db/connection.js";
import app from "./app.js";

connectDB()
    .then(() => {
        app.listen(process.env.PORT, () =>
            console.log(`Server started at http://localhost:${process.env.PORT}`)
        );
    })
    .catch((err) => {
        console.log("DB Connection Failed!", err);
    });
