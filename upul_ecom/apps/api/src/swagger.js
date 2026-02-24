const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: "Upul E-com API",
    description: "API for Auth and Product services",
    version: "1.0.0",
  },
  host: "localhost:4000",
  basePath: "/api",
  schemes: ["http"],
  consumes: ['application/json'],
  produces: ['application/json'],
  
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./main.ts']; 

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log('Swagger file generated successfully!');
});