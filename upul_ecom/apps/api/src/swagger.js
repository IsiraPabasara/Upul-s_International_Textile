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
  
  definitions: {
    Product: {
      $name: "Classic T-Shirt",
      $sku: "TS-001-BLK-M",
      $description: "Cotton t-shirt",
      $price: 2500,
      $stock: 100,
      $brand: "Upul Basics",
      availability: true,
      photos: ["url1", "url2"],
      colors: ["#000", "#FFF"],
      size: "M"
    },
    CreateProductDto: {
      $name: "Classic T-Shirt",
      $sku: "TS-001-BLK-M",
      $description: "Cotton t-shirt",
      $price: 2500,
      $stock: 100,
      $brand: "Upul Basics",
      photos: ["url1"],
      colors: ["#000"],
      size: "M"
    },
    CreateCategory: {
      $name: "Men",
      parentId: "5f8d0d55b54764421b7156c9" 
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/main.router.ts']; 

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    console.log('Swagger file generated successfully!');
});