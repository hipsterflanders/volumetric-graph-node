 const express = require("express")
var app = express()
app.get("/",function(request,response){
response.send("volumetric-graph-node app is running on this adress")
})

const port = Number.parseInt(process.env.PORT) || 3000;
app.listen(port, function () {
console.log("Started application on port %d", port)
});

app.use(express.static('public'));
app.use(express.json({ limit: '1Gb' }));