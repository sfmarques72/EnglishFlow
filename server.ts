import dotenv from "dotenv";
import { createApp } from "./server/app.ts";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function startServer() {
  const app = await createApp({ serveFrontend: true });
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
