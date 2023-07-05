const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname)));

const port = 8000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
