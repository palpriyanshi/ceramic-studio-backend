import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MERN Backend API",
      version: "1.0.0",
      description: "REST API for MERN e-commerce application",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id:          { type: "string" },
            name:         { type: "string" },
            email:        { type: "string" },
            role:         { type: "string", enum: ["user", "admin"] },
            profileImage: { type: "string" },
            createdAt:    { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id:                { type: "string" },
            title:              { type: "string" },
            description:        { type: "string" },
            category:           { type: "string" },
            price:              { type: "number" },
            discountPercentage: { type: "number" },
            rating:             { type: "number" },
            stock:              { type: "number" },
            brand:              { type: "string" },
            thumbnail:          { type: "string" },
            images:             { type: "array", items: { type: "string" } },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id:         { type: "string" },
            user:        { type: "string" },
            items:       { type: "array" },
            grandTotal:  { type: "number" },
            status:      { type: "string" },
            createdAt:   { type: "string", format: "date-time" },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
      },
    },
  },
  // Pick up OpenAPI specifications from all yaml files
  apis: ["./apidocs/*.yaml"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
