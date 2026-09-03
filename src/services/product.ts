// lib/services/productService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProductSchema } from "@/validations/product";

// Custom errors
export class ProductNotFoundError extends Error {
  constructor(message = "Product not found") {
    super(message);
    this.name = "ProductNotFoundError";
  }
}

export class ProductValidationError extends Error {
  tree: ReturnType<typeof z.treeifyError> | undefined;

  constructor(message: string, tree?: ReturnType<typeof z.treeifyError>) {
    super(message);
    this.name = "ProductValidationError";
    this.tree = tree;
  }
}

export async function getProductById(productId: string) {
  // Validate productId
  const result = getProductSchema.safeParse(productId);
  if (!result.success) {
    const tree = z.treeifyError(result.error);
    throw new ProductValidationError("Validation Error", tree);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      amount: true,
      description: true,
      images: true,
      name: true,
    },
  });

  if (!product) {
    throw new ProductNotFoundError();
  }

  return product;
}
