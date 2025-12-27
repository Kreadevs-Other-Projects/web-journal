import app from "./app";
import { env } from "./configs/envs";

app.listen(env.PORT, () => {
  console.log(`Server is running on port: ${env.PORT}`);
});
