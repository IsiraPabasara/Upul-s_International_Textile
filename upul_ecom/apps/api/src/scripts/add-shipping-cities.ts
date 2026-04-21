import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cities = [
  {
    name: 'Ratnapura',
    shippingCost: 350,
    isActive: true,
  },
  {
    name: 'Pelmadulla',
    shippingCost: 300,
    isActive: true,
  },
  {
    name: 'Embilipitiya',
    shippingCost: 450,
    isActive: true,
  },
];

async function addShippingCities() {
  try {
    console.log('Starting to add shipping cities...');

    for (const city of cities) {
      const existingCity = await prisma.shippingCity.findUnique({
        where: { name: city.name },
      });

      if (existingCity) {
        console.log(`City "${city.name}" already exists. Skipping...`);
      } else {
        const newCity = await prisma.shippingCity.create({
          data: city,
        });
        console.log(`✓ Added city: ${newCity.name} (Shipping Cost: LKR ${newCity.shippingCost})`);
      }
    }

    console.log('✓ All shipping cities have been processed!');
  } catch (error) {
    console.error('Error adding shipping cities:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addShippingCities();
