const dotenv = require("dotenv");

const { connectDb } = require("./config/db");
const { createApp } = require("./app");

dotenv.config();

async function main() {
  await connectDb(process.env.MONGODB_URI);
  // eslint-disable-next-line no-console
  console.log("Database connected");

  const app = createApp();

  const port = Number(process.env.PORT || 4000);
  app.listen(port, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server started on http://0.0.0.0:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

