import app from "./app";
import config from "./common/config"

const host = config.app.host;
const port = config.app.port;

app.listen(5000, () => {
    console.log(`Server is running at http://${host}:${port}`);
});