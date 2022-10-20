const express = require('express');
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];



//Middlewere
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.params;

  const currentClient = customers.find(customer => customer.cpf === cpf);

  if(!currentClient) {
    response.status(400).json({
      error: "Customer not found"
    })
  }
  
  request.customer = currentClient

  return next();
}

//Util
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit'){
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0);

  return balance
}

app.post('/account', (request, response,) => { 
  const {cpf, name} = request.body;

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if(customerAlreadyExists) {
    return response.status(400).send("CPF already exists");
  }

  const newAccount = {
    cpf,
    name,
    id : uuidv4(),
    statement: [],
  };
  
  customers.push(newAccount);
  
  return response.status(201).send();

});

app.get("/statement/:cpf", verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request;

  return response.json(customer.statement)
})

app.post("/deposit/:cpf", verifyIfExistsAccountCPF, (request, response) => {
    const {description, amount} = request.body;
    
    const {customer} = request;

    const statementOperation = {
      description,
      amount,
      created_at: new Date().toLocaleDateString(),
      type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.post("/withdraw/:cpf", verifyIfExistsAccountCPF, (request, response) => {
  const {amount} = request.body;
  const {customer} = request;

  const balance = getBalance(customer.statement);
  
  const isOperationValid =  balance >= amount;

  if(!isOperationValid) {
    return response.status(403).json({error: `Insufficient funds. Current balance: ${balance}`})
  } 

  const statementOperation = {
    amount,
    created_at: new Date().toLocaleDateString(),
    type: "debit"
  }

  customer.statement.push(statementOperation);

  return response.status(200).json({currentBalance: `Current balance: ${balance}`})
  

});

app.get("/statement-by-date/:cpf", verifyIfExistsAccountCPF, (request, response) => {
  const {date} = request.query;

  const {customer} = request;

  const statement = customer.statement.filter(statement => statement.created_at === date)

  return response.json(statement)
})

app.put("/account/:cpf", verifyIfExistsAccountCPF, (request, response) => {
  const {name} = request.body
  const {customer} = request;

  customer.name = name;

  return response.status(201).send()
});

app.get("/account/:cpf", verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request;

  return response.json(customer)
})

app.delete("/account/:cpf", verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request;
  
  const objWithIdIndex = customers.findIndex((obj) => obj.cpf === customer.cpf);
  
  if(objWithIdIndex >= 0) {
    customers.splice(objWithIdIndex, 1);

    return response.status(201).send("CPF CANCELADO !!!")

  } else {
    return response.status(403).send("CPF not found")
  }
})

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance)
})






app.listen(3333);