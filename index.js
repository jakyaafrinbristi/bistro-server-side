const express =require('express')
const cors =require('cors')
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 9000; 

const app =express()
const corsOptions ={
    origin:['http://localhost:5173','http://localhost:5174'],
    credentials:true,
    optionSuccessStatus:200,
}
app.use(cors(corsOptions))
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x22d1po.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const menuCollection = client.db('bistroBoss').collection('menu');
    const reviewCollection = client.db('bistroBoss').collection('reviews');

    const cartsCollection = client.db('bistroBoss').collection('carts');

    const usersCollection = client.db('bistroBoss').collection('users');



    //jwt related 
    app.post('/jwt',async(req,res)=>{
      const user=req.body;
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:'365d'
      });
      res.send({token})
    })

   // middlewares
   const verifyToken=(req,res,next)=>{
    console.log('inside verify token',req.headers)
    if(!req.headers.authorization){
      return res.status(401).send({message:"forbidden access"})
    }
    const token=req.headers.authorization.split(' ')[1]
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
 if(err){
  return res.status(401).send({message:"forbidden access"})
 }
 req.decoded=decoded;
 next();
 
  })

   }
 


    // users related api 

    // get users related data in database
    app.get('/users',verifyToken ,async(req,res)=>{
      // console.log(req.headers)
      const result=await usersCollection.find().toArray()
      res.send(result)
    })
    // post users related data in database
    app.post('/users',async(req,res)=>{
      const user=req.body;
      const query ={ email:user.email }
      const existingUser =await usersCollection.findOne(query)
      if(existingUser){
        return res.send({message:'user already exist',insertedId:null})
      }
      const result=await usersCollection.insertOne(user)
      res.send(result)
    })
    //patch related user data
    app.patch('/users/admin/:id',async(req,res)=>{
      const id =req.params.id;
      const filter={_id:new ObjectId(id)}
      const updatedDoc={
        $set:{
          role:'admin'
        }
      }
      const result =await usersCollection.updateOne(filter,updatedDoc);
      res.send(result)
    })

     // delete users related data in database
     app.delete('/users/:id',async(req,res)=>{
      const id =req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    //  menu related
       // get all cards from mongo
       app.get('/menu',async(req,res)=>{
        const cursor =menuCollection.find();
        const result =await cursor.toArray();
        res.send(result);
  
      })
       // get all cards from mongo
       app.get('/reviews',async(req,res)=>{
        const cursor =reviewCollection.find();
        const result =await cursor.toArray();
        res.send(result);
  
      })
       // get all carts from mongo
       app.get('/carts',async(req,res)=>{
        const email=req.query.email
        const query ={email : email}
        const cursor =cartsCollection.find(query);
        const result =await cursor.toArray();
        res.send(result);
  
      })
      // get delete
      app.delete('/carts/:id',async(req,res)=>{
        const id =req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await cartsCollection.deleteOne(query)
        res.send(result)
      })
      //post data mongo
      app.post('/carts',async(req,res)=>{
        const cartItem=req.body;
        const result=await cartsCollection.insertOne(cartItem)
        res.send(result)
      })

  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);



app.get('/', (req,res)=>{
    res.send('bistroboss')
})
app.listen(port,()=>console.log(`server is running ${port}`))