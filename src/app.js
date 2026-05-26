import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import authRoutes from "../routes/auth.routes.js";
import productRoutes from "../routes/product.route.js";
import userRoutes from "../routes/users.route.js";
import orderRoutes from "../routes/order.route.js";
import adminUserRoutes from "../routes/admin/adminUser.routes.js";
import adminOrderRoutes from "../routes/admin/adminOrder.routes.js";
import adminProductRoutes from "../routes/admin/adminProduct.routes.js";
import errorMiddleware from "../middlewares/error.middleware.js";
import swaggerSpec from "../config/swagger.config.js";

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/orders", adminOrderRoutes);
app.use("/api/v1/admin/products", adminProductRoutes);

app.get("/health", (_req, res) => res.status(200).json({ message: "Healthy" }));

app.use(errorMiddleware);

export default app;
