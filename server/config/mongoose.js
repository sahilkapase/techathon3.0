const mongoose = require('mongoose');
require('dotenv').config();

const URI = process.env.MONGODB_URI || "mongodb+srv://sahilkapase97_db_user:0fYwDPjBMhZKU7Sy@cluster0.uigit4n.mongodb.net/?appName=Cluster0";

mongoose.connect(URI);
    //   useUnifiedTopology: true,
    //   useNewUrlParser: true});
const db = mongoose.connection;

db.on('error',console.error.bind(console,'Error into coonect to the database'));

db.once('open',function()
{
    console.log("/////Database is connected sucessfully/////");
});





// const connectDB = async () => {
//     await mongoose.connect(URI, {
//       useUnifiedTopology: true,
//       useNewUrlParser: true
//     });
//     console.log('db connected..!');
//   };
  
//   module.exports = connectDB;
  




