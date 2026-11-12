const app = require('./app');
const { port } = require('./config');

app.listen(port, () => console.log(`Sweety API running on http://localhost:${port}`));
