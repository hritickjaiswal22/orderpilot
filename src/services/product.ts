// lib/services/productService.ts
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getProductSchema } from "@/validations/product";
import { AppError } from "@/lib/error";

export async function getProductById(productId: string) {
  // Validate productId
  const result = getProductSchema.safeParse(productId);
  if (!result.success) {
    const tree = z.treeifyError(result.error);
    throw new AppError(
      "One or more request parameters are missing or invalid. - INVALID_REQUEST_PARAMS",
      400,
      tree,
    );
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
    throw new AppError(
      "The product associated with the provided ID does not exist. - PRODUCT_NOT_FOUND",
      404,
    );
  }

  return product;
}
