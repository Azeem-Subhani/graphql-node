const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("apollo-server-express");
const { createServer } = require('http');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { useServer } = require('graphql-ws/lib/use/ws');
const { WebSocketServer } = require('ws');

const resolvers = require("./schema/resolvers");
const typeDefs = require("./schema/typeDef");
const { authMiddleware } = require("./utils/auth");

const dbConnection = async () => {
  try {
    await mongoose.connect("xxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    console.log("🚀 Successful database connection.");
  } catch (error) {
    console.error("Connection error:", error);
  }
};

const startServer = async () => {
  await dbConnection();
  const app = express();
  app.use(cors());

  const httpServer = createServer(app);

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      let context = {};
      if (req) {
        try {
          const token = req.headers.token;
          if (token) {
            context = await authMiddleware(token);
          }
        } catch (error) {
          console.error("Error in auth middleware", error);
        }
      }
      return context;
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  useServer({ schema }, wsServer);

  httpServer.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
    console.log(`🚀 Subscriptions ready at ws://localhost:4000${server.graphqlPath}`);
  });
};

startServer();
