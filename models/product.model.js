import mongoose from "mongoose";

const detailsSchema = new mongoose.Schema(
  {
    material:   { type: String },
    dimensions: { type: String },
    capacity:   { type: String },
    care:       { type: String },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    _id:         { type: String, required: true },
    name:        { type: String, required: true, trim: true },
    price:       { type: Number, required: true },
    salePrice:   { type: Number },
    category:    { type: String, required: true, index: true },
    image:       { type: String, required: true },
    hoverImage:  { type: String },
    description: { type: String },
    details:     { type: detailsSchema },
    inStock:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
