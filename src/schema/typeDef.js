const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    todos: [Todo!]!
  }

  type Todo {
    id: ID!
    title: String!
    description: String
    dueDate: String
    completed: Boolean
    user: User!
  }

  input TodoFilter {
    title: String
    description: String
    dueDate: String
    completed: Boolean
  }
  
  input Pagination {
    limit: Int
    skip: Int
  }

  input TodoInput {
    title: String!
    description: String
    dueDate: String
    completed: Boolean
  }

  type TodoConnection {
    todos: [Todo!]!
    filter: TodoFilterOutput
    pagination: PaginationOutput
  }
  
  type TodoFilterOutput {
    title: String
    description: String
    dueDate: String
    completed: Boolean
  }
  
  type PaginationOutput {
    limit: Int
    skip: Int
  }

  type Query {
    allTodos(filter: TodoFilter, pagination: Pagination): TodoConnection!
    todos(filter: TodoFilter, pagination: Pagination): TodoConnection!
    todo(id: ID!): Todo!
  }

  type Mutation {
    signup(email: String!, password: String!): String!
    signin(email: String!, password: String!): String!
    createTodo(title: String!, description: String, dueDate: String): Todo
    updateTodo(id: ID!, title: String, description: String, dueDate: String, completed: Boolean): Todo
    deleteTodo(id: ID!): Todo
  }

  type Subscription {
    todoChanged: Todo!
  }
`;

module.exports = typeDefs;
