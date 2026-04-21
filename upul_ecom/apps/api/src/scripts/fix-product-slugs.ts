import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateUniqueSlug(productName: string, existingSlugs: Set<string>): Promise<string> {
  // Create a base slug from product name
  let baseSlug = productName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  if (!baseSlug) {
    baseSlug = 'product';
  }

  // If base slug already exists, add a random suffix
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

async function fixProductSlugs() {
  try {
    console.log('🔧 Starting product slug fix...\n');

    // Get all products
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log(`📊 Found ${allProducts.length} total products\n`);

    // Find products with null slugs
    const productsWithNullSlugs = allProducts.filter((p) => !p.slug);
    console.log(`⚠️  Products with null slugs: ${productsWithNullSlugs.length}`);

    if (productsWithNullSlugs.length === 0) {
      console.log('✅ No products with null slugs found!');
    }

    // Find products with duplicate slugs
    const slugCounts = new Map<string, number>();
    const duplicateSlugs = new Set<string>();

    allProducts.forEach((p) => {
      if (p.slug) {
        const count = (slugCounts.get(p.slug) || 0) + 1;
        slugCounts.set(p.slug, count);
        if (count > 1) {
          duplicateSlugs.add(p.slug);
        }
      }
    });

    console.log(`⚠️  Duplicate slugs found: ${duplicateSlugs.size}`);
    if (duplicateSlugs.size > 0) {
      console.log(`   Duplicate slug values: ${Array.from(duplicateSlugs).join(', ')}\n`);
    }

    // Collect all existing valid slugs
    const existingSlugs = new Set<string>();
    allProducts.forEach((p) => {
      if (p.slug && !duplicateSlugs.has(p.slug)) {
        existingSlugs.add(p.slug);
      }
    });

    // Fix null slugs
    let fixedCount = 0;
    console.log('🔄 Fixing products...\n');

    for (const product of productsWithNullSlugs) {
      const newSlug = await generateUniqueSlug(product.name, existingSlugs);
      await prisma.product.update({
        where: { id: product.id },
        data: { slug: newSlug },
      });
      console.log(`✅ Product "${product.name}" -> slug: "${newSlug}"`);
      fixedCount++;
    }

    // Fix duplicate slugs
    const productsToFixBySlug = allProducts.filter(
      (p) => p.slug && duplicateSlugs.has(p.slug)
    );

    for (const product of productsToFixBySlug) {
      const newSlug = await generateUniqueSlug(product.name, existingSlugs);
      await prisma.product.update({
        where: { id: product.id },
        data: { slug: newSlug },
      });
      console.log(`✅ Product "${product.name}" (was: "${product.slug}") -> slug: "${newSlug}"`);
      fixedCount++;
    }

    console.log(`\n✨ Fixed ${fixedCount} products total`);
    console.log('✅ Database cleanup complete!\n');
  } catch (error) {
    console.error('❌ Error fixing product slugs:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductSlugs();
