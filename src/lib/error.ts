import { z } from "zod";

export class AppError extends Error {
  status: number;
  error: ReturnType<typeof z.treeifyError> | undefined;

  constructor(
    message: string,
    status: number,
    tree?: ReturnType<typeof z.treeifyError>,
  ) {
    super(message);
    this.status = status;
    this.error = tree;
  }
}
