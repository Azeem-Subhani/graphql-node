const bcrypt  = require("bcryptjs")

const  User  = require('../models/User');
const  Todo  = require('../models/Todo');

const {authenticateUser, generateToken} = require('../utils/auth');

const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();


const resolvers = {
    Query: {
      todos: async (_, { filter, pagination }, user ) => {
        try {
          const { limit = 10, skip = 0 } = pagination || {};
          let query = { user: user._id };
          if (filter) {
            if (filter.completed !== undefined) query.completed = filter.completed;
            if (filter.title) query.title = filter.title;
            if (filter.description) query.description = filter.description;
            if (filter.dueDate) query.dueDate = filter.dueDate;
          }
          const todos = await Todo.find(query).skip(skip).limit(limit).populate('user');
          return {
            todos: todos,
            filter: filter,
            pagination: { limit, skip }
          };
        } catch(error) {
          console.log(error);
        }
      },
      todo: async (_, { id }) => {
        return Todo.findById(id).populate('user')
      },
      allTodos: async (_, { filter, pagination }, user ) => {
        try {
          const { limit = 10, skip = 0 } = pagination || {};
          let query = {}
          if (filter) {
            if (filter.completed !== undefined) query.completed = filter.completed;
            if (filter.title) query.title = filter.title;
            if (filter.description) query.description = filter.description;
            if (filter.dueDate) query.dueDate = filter.dueDate;
          }

          const todos = await Todo.find(query).skip(skip).limit(limit).populate('user');
          return {
            todos: todos,
            filter: filter,
            pagination: { limit, skip }
          };
        } catch (error) {
          console.log(error);
          throw new Error('Error fetching all todos');
        }
      },
    },
    Mutation: {
      signup: async (_, { email, password }) => {
        try {
          const hashedPassword = await bcrypt.hash(password, 10);
          const user = await User.create({ email, password: hashedPassword });
          return generateToken(user);
        } catch(err) {
            console.log("Err from mutation sign up");
            console.log(err);
        }
      },
      signin: async (_, { email, password }) => {
        try {
          return await authenticateUser(email, password)
        } catch(error) {
          console.log(error);
        }
      },
      createTodo: async (_, { title, description, dueDate }, user) => {
        try {
          if(!user) throw new Error("Invalid Token")
          const todo = await Todo.create({ title, description, dueDate, user: user._id });
          const populatedTodo = await Todo.findById(todo._id).populate('user');
          pubsub.publish('TODO_CHANGED', { todoChanged: populatedTodo });
          return populatedTodo;
        } catch(error) {
          console.log("Error While creating a todo");
          console.log(error);
        }
      },
      updateTodo: async (_, updatedTodo, user) => {
        try {
          console.log("updatedTodo",updatedTodo)
          if(!user) throw new Error("Invalid Token")
          const todo = await Todo.findById(updatedTodo?.id).populate('user');
          if(!todo) throw new Error("Todo not found")
          if(updatedTodo?.title) todo.title = updatedTodo?.title;
          if(updatedTodo?.description) todo.description = updatedTodo?.description;
          if(updatedTodo?.dueDate) todo.dueDate = updatedTodo?.dueDate;
          if(updatedTodo?.completed) todo.completed = updatedTodo?.completed;
          pubsub.publish('TODO_CHANGED', { todoChanged: todo });
          return await todo.save();
        } catch(error) {
          console.log("Error while updating a todo");
          console.log(error);
        }
      },
      deleteTodo: async (_, deleteTodo, user) => {
        try {
          if(!user) throw new Error("Invalid Token")
          console.log("deleteTodo", deleteTodo)
          const todo = await Todo.findById(deleteTodo?.id).populate('user');
          if(!todo) throw new Error("Todo not found")
          console.log("todo",todo)
          await Todo.deleteOne({ _id: deleteTodo?.id });
          pubsub.publish('TODO_CHANGED', { todoChanged: todo });
          return todo;
        } catch(error) {
          console.log("Error while deleting a todo");
          console.log(error);
        }
      },
    },
    Subscription: {
      todoChanged: {
        subscribe: () => pubsub.asyncIterator(['TODO_CHANGED']),
      },
    },
  };

  module.exports = resolvers;