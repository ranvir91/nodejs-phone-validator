import {app} from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js"

dotenv.config({
    path : './.env'
});

// connect mongodb atlas here
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=> {
        console.log(`Server is running on port ${process.env.PORT}`);        
    })
})
.catch((err)=> {
    console.log(`MONGODB connection failed`, err);    
})

// api to check the server health
app.get('/api/v1/health', (req, res) => {
    res.send('App is working awesome!')
});


// Export the app for serverless deployment
export default app;
