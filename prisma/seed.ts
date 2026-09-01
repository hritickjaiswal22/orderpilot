import { fakerEN_IN as faker } from "@faker-js/faker";
import { Prisma, OrderStatus, SupportStatus } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

interface PlannedItem {
  productId: string;
  quantity: number;
  unitAmount: Prisma.Decimal;
}

function getRandomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = faker.number.int({ min, max });
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  // Clear existing data (order matters: children first)
  await prisma.refund.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.support.deleteMany();
  await prisma.user.deleteMany();

  // Create 5 users
  const users = [];
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} - ${faker.location.zipCode()}`,
      },
    });
    users.push(user);
  }

  const supportCount = 10;
  for (let i = 0; i < supportCount; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const supportDate = faker.date.recent({ days: 30 }); // random within last 30 days
    await prisma.support.create({
      data: {
        userId: user.id,
        issue: faker.lorem.paragraphs(1), // or faker.lorem.sentences()
        status: faker.helpers.enumValue(SupportStatus),
        createdAt: supportDate,
        updatedAt: supportDate, // keep consistent for seed
      },
    });
  }

  // Create 10 products
  const products = [];
  for (let i = 0; i < 10; i++) {
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        images: [faker.image.url(), faker.image.url()],
        // Generates a price string compatible with Prisma Decimal (e.g., in INR range)
        amount: faker.commerce.price({ min: 299, max: 25000, dec: 2 }),
      },
    });

    products.push(product);
  }

  const orderCount = 10; // how many orders to create

  for (let i = 0; i < orderCount; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const orderProducts = getRandomSubset(products, 1, 5);

    // Generate a random timestamp within the last 8 days
    const orderDate = faker.date.recent({ days: 8 });

    // Pre‑compute items and total as before
    const plannedItems: PlannedItem[] = orderProducts.map((product) => {
      const unitAmount = new Prisma.Decimal(
        faker.commerce.price({ min: 10, max: 500 }),
      );
      const quantity = faker.number.int({ min: 1, max: 10 });
      return {
        productId: product.id,
        quantity,
        unitAmount,
      };
    });

    const total = plannedItems.reduce(
      (sum, item) => sum.plus(item.unitAmount.mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    // Create order with the same `createdAt` and `updatedAt`
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        originalPaidAmount: total,
        status: faker.helpers.enumValue(OrderStatus),
        createdAt: orderDate,
        updatedAt: orderDate, // explicitly set to avoid auto‑update to now()
      },
    });

    // Create order items with the same timestamp
    const createdOrderItems = [];
    for (const item of plannedItems) {
      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          userId: user.id,
          originalUnitAmount: item.unitAmount,
          quantity: item.quantity,
          createdAt: orderDate,
          updatedAt: orderDate,
        },
      });
      createdOrderItems.push(orderItem);
    }

    // Optional: create refunds (if needed) with a later timestamp
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
