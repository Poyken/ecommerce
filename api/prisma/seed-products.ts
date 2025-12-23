import { PrismaClient } from '@prisma/client';

/**
 * =====================================================================
 * PRODUCT SEED - Tạo dữ liệu sản phẩm nội thất cao cấp
 * =====================================================================
 *
 * File này tạo ra nhiều sản phẩm nội thất luxury với:
 * - Brands và Categories
 * - Đầy đủ thông tin product
 * - Options (Size, Color, Material)
 * - SKUs với giá, stock, images
 *
 * Chạy: npm run seed:products
 * =====================================================================
 */

const prisma = new PrismaClient();

// =====================================================================
// BRANDS - Các thương hiệu nội thất cao cấp
// =====================================================================
const BRANDS_DATA = [
  {
    name: 'Minotti',
    imageUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=80',
  },
  {
    name: 'B&B Italia',
    imageUrl:
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=200&q=80',
  },
  {
    name: 'Roche Bobois',
    imageUrl:
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200&q=80',
  },
  {
    name: 'Poliform',
    imageUrl:
      'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=200&q=80',
  },
  {
    name: 'Cassina',
    imageUrl:
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=200&q=80',
  },
  {
    name: 'Fendi Casa',
    imageUrl:
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=200&q=80',
  },
  {
    name: 'Versace Home',
    imageUrl:
      'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=200&q=80',
  },
  {
    name: 'Restoration Hardware',
    imageUrl:
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200&q=80',
  },
  {
    name: 'Knoll',
    imageUrl:
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=200&q=80',
  },
  {
    name: 'Herman Miller',
    imageUrl:
      'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=200&q=80',
  },
];

// =====================================================================
// CATEGORIES - Danh mục sản phẩm
// =====================================================================
const CATEGORIES_DATA = [
  {
    name: 'Sofas',
    slug: 'sofas',
    imageUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    metaTitle: 'Luxury Sofas | Premium Seating',
    metaDescription: 'Discover our collection of luxury sofas and sectionals.',
  },
  {
    name: 'Chairs',
    slug: 'chairs',
    imageUrl:
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&q=80',
    metaTitle: 'Designer Chairs | Luxury Seating',
    metaDescription: 'Premium chairs for every room in your home.',
  },
  {
    name: 'Tables',
    slug: 'tables',
    imageUrl:
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&q=80',
    metaTitle: 'Luxury Tables | Dining & Coffee Tables',
    metaDescription: 'Elegant tables crafted from premium materials.',
  },
  {
    name: 'Storage',
    slug: 'storage',
    imageUrl:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80',
    metaTitle: 'Storage Solutions | Wardrobes & Cabinets',
    metaDescription: 'Sophisticated storage solutions for modern homes.',
  },
  {
    name: 'Beds',
    slug: 'beds',
    imageUrl:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80',
    metaTitle: 'Luxury Beds | Premium Bedroom Furniture',
    metaDescription: 'Sleep in style with our luxury bed collection.',
  },
  {
    name: 'Outdoor',
    slug: 'outdoor',
    imageUrl:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80',
    metaTitle: 'Outdoor Furniture | Patio & Garden',
    metaDescription: 'Weather-resistant luxury outdoor furniture.',
  },
  {
    name: 'Rugs',
    slug: 'rugs',
    imageUrl:
      'https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&q=80',
    metaTitle: 'Luxury Rugs | Handcrafted Carpets',
    metaDescription: 'Handwoven rugs from around the world.',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    imageUrl:
      'https://images.unsplash.com/photo-1612372606404-0ab33e7187ee?w=400&q=80',
    metaTitle: 'Home Accessories | Decor & Art',
    metaDescription: 'Finishing touches for your luxury interior.',
  },
  {
    name: 'Lighting',
    slug: 'lighting',
    imageUrl:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
    metaTitle: 'Designer Lighting | Lamps & Chandeliers',
    metaDescription: 'Illuminate your space with designer lighting.',
  },
  {
    name: 'Outlet',
    slug: 'outlet',
    imageUrl:
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80',
    metaTitle: 'Outlet | Clearance & Deals',
    metaDescription: 'Premium furniture at discounted prices.',
  },
];

// Luxury furniture image URLs from Unsplash - More diverse collection
const FURNITURE_IMAGES = {
  // Sofas - Various styles and colors
  sofas: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
    'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800&q=80',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
    'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&q=80',
    'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80',
    'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?w=800&q=80',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',
  ],
  // Chairs - Different types and designs
  chairs: [
    'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
    'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80',
    'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&q=80',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80',
    'https://images.unsplash.com/photo-1549497538-303791108f95?w=800&q=80',
    'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80',
    'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=800&q=80',
  ],
  // Tables - Dining, coffee, side tables
  tables: [
    'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800&q=80',
    'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&q=80',
    'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80',
    'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800&q=80',
    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80',
    'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80',
  ],
  // Storage - Wardrobes, shelves, cabinets
  storage: [
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80',
    'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=800&q=80',
    'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=800&q=80',
    'https://images.unsplash.com/photo-1595514535116-d3196c680e68?w=800&q=80',
    'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
  ],
  // Beds - Various bedroom styles
  beds: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
    'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=800&q=80',
    'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
    'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80',
  ],
  // Outdoor - Patio and garden
  outdoor: [
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80',
    'https://images.unsplash.com/photo-1533779283484-8ad4940aa3a8?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80',
  ],
  // Rugs - Various patterns
  rugs: [
    'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80',
    'https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=800&q=80',
    'https://images.unsplash.com/photo-1588543385197-a40aaf6d7b5f?w=800&q=80',
    'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=800&q=80',
    'https://images.unsplash.com/photo-1575414003552-cd4ddc657d47?w=800&q=80',
    'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80',
    'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80',
    'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&q=80',
  ],
  // Accessories - Decor items
  accessories: [
    'https://images.unsplash.com/photo-1612372606404-0ab33e7187ee?w=800&q=80',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80',
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&q=80',
    'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=800&q=80',
    'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=800&q=80',
  ],
  // Lighting - Various lamp styles
  lighting: [
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80',
    'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80',
    'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&q=80',
    'https://images.unsplash.com/photo-1573790387438-4da905039392?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=800&q=80',
    'https://images.unsplash.com/photo-1489171078254-c3365d6e359f?w=800&q=80',
  ],
  // Outlet - Mixed items
  outlet: [
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80',
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80',
    'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&q=80',
    'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80',
  ],
};

// Product templates by category
const PRODUCT_TEMPLATES = {
  sofas: [
    {
      name: 'Milano Sectional Sofa',
      basePrice: 4500,
      desc: 'Luxurious Italian-design sectional with premium leather upholstery.',
    },
    {
      name: 'Aria Modular Sofa',
      basePrice: 3800,
      desc: 'Modular sofa system with customizable configurations.',
    },
    {
      name: 'Como Curved Sofa',
      basePrice: 5200,
      desc: 'Elegant curved design with velvet finish.',
    },
    {
      name: 'Verona Classic Sofa',
      basePrice: 3200,
      desc: 'Timeless three-seater with Italian craftsmanship.',
    },
    {
      name: 'Torino L-Shaped Sofa',
      basePrice: 4800,
      desc: 'Spacious L-shaped design for modern living rooms.',
    },
  ],
  chairs: [
    {
      name: 'Barcelona Lounge Chair',
      basePrice: 1800,
      desc: 'Iconic mid-century modern design with leather cushions.',
    },
    {
      name: 'Eames Replica Armchair',
      basePrice: 1200,
      desc: 'Classic shell design with premium wood legs.',
    },
    {
      name: 'Roma Accent Chair',
      basePrice: 950,
      desc: 'Elegant accent chair with brass details.',
    },
    {
      name: 'Firenze Dining Chair',
      basePrice: 650,
      desc: 'Refined dining chair with leather seat.',
    },
    {
      name: 'Napoli Office Chair',
      basePrice: 1500,
      desc: 'Ergonomic luxury office chair.',
    },
  ],
  tables: [
    {
      name: 'Carrara Marble Dining Table',
      basePrice: 6500,
      desc: 'Stunning Italian marble top with brass base.',
    },
    {
      name: 'Venezia Coffee Table',
      basePrice: 1800,
      desc: 'Sculptural coffee table with glass top.',
    },
    {
      name: 'Tuscany Console Table',
      basePrice: 2200,
      desc: 'Elegant console with walnut finish.',
    },
    {
      name: 'Siena Side Table',
      basePrice: 890,
      desc: 'Compact side table with marble accent.',
    },
    {
      name: 'Palermo Dining Set',
      basePrice: 8500,
      desc: 'Complete dining set for 8 persons.',
    },
  ],
  storage: [
    {
      name: 'Modena Wardrobe System',
      basePrice: 7200,
      desc: 'Walk-in wardrobe system with LED lighting.',
    },
    {
      name: 'Bologna Bookshelf',
      basePrice: 2400,
      desc: 'Floor-to-ceiling bookshelf with oak finish.',
    },
    {
      name: 'Parma Sideboard',
      basePrice: 3100,
      desc: 'Minimalist sideboard with hidden storage.',
    },
    {
      name: 'Ravenna TV Console',
      basePrice: 1950,
      desc: 'Sleek TV console with cable management.',
    },
    {
      name: 'Genova Display Cabinet',
      basePrice: 2800,
      desc: 'Glass-front display cabinet.',
    },
  ],
  beds: [
    {
      name: 'Royal Platform Bed',
      basePrice: 4200,
      desc: 'King-size platform bed with upholstered headboard.',
    },
    {
      name: 'Luna Four-Poster Bed',
      basePrice: 6800,
      desc: 'Elegant four-poster bed in solid oak.',
    },
    {
      name: 'Stella Floating Bed',
      basePrice: 3800,
      desc: 'Modern floating bed design.',
    },
    {
      name: 'Notte Storage Bed',
      basePrice: 3500,
      desc: 'Bed with integrated storage drawers.',
    },
    {
      name: 'Alba Canopy Bed',
      basePrice: 5500,
      desc: 'Romantic canopy bed with fabric drapes.',
    },
  ],
  outdoor: [
    {
      name: 'Riviera Outdoor Sofa Set',
      basePrice: 4800,
      desc: 'Weather-resistant outdoor sofa set.',
    },
    {
      name: 'Capri Sun Lounger',
      basePrice: 1200,
      desc: 'Adjustable sun lounger with cushion.',
    },
    {
      name: 'Amalfi Dining Set',
      basePrice: 3500,
      desc: 'Outdoor dining set for 6 persons.',
    },
    {
      name: 'Portofino Hanging Chair',
      basePrice: 1800,
      desc: 'Suspended egg chair for outdoor use.',
    },
    {
      name: 'Sardinia Daybed',
      basePrice: 2800,
      desc: 'Luxurious outdoor daybed with canopy.',
    },
  ],
  rugs: [
    {
      name: 'Persian Silk Rug 8x10',
      basePrice: 3500,
      desc: 'Hand-woven Persian silk rug.',
    },
    {
      name: 'Moroccan Wool Rug',
      basePrice: 1800,
      desc: 'Traditional Moroccan patterns.',
    },
    {
      name: 'Modern Abstract Rug',
      basePrice: 1200,
      desc: 'Contemporary abstract design.',
    },
    {
      name: 'Shag Area Rug',
      basePrice: 890,
      desc: 'Plush shag rug for comfort.',
    },
    {
      name: 'Vintage Kilim Rug',
      basePrice: 2200,
      desc: 'Authentic vintage kilim.',
    },
  ],
  accessories: [
    {
      name: 'Murano Glass Vase',
      basePrice: 450,
      desc: 'Hand-blown Murano glass vase.',
    },
    {
      name: 'Bronze Sculpture Set',
      basePrice: 1200,
      desc: 'Contemporary bronze art pieces.',
    },
    {
      name: 'Marble Bookends',
      basePrice: 280,
      desc: 'Carrara marble bookends.',
    },
    {
      name: 'Crystal Chandelier',
      basePrice: 2800,
      desc: 'Swarovski crystal chandelier.',
    },
    {
      name: 'Ceramic Planters Set',
      basePrice: 350,
      desc: 'Handcrafted ceramic planters.',
    },
  ],
  lighting: [
    {
      name: 'Arc Floor Lamp',
      basePrice: 890,
      desc: 'Modern arc floor lamp with marble base.',
    },
    {
      name: 'Tiffany Table Lamp',
      basePrice: 650,
      desc: 'Stained glass Tiffany-style lamp.',
    },
    {
      name: 'Pendant Light Cluster',
      basePrice: 1200,
      desc: 'Multi-pendant cluster light.',
    },
    {
      name: 'Minimalist Desk Lamp',
      basePrice: 320,
      desc: 'Sleek LED desk lamp.',
    },
    { name: 'Sconce Wall Light', basePrice: 280, desc: 'Brass wall sconce.' },
  ],
  outlet: [
    {
      name: 'Sample Leather Chair',
      basePrice: 480,
      desc: 'Floor sample - 40% off.',
    },
    {
      name: 'Discontinued Sofa',
      basePrice: 1800,
      desc: 'Last piece - discontinued model.',
    },
    {
      name: 'Clearance Coffee Table',
      basePrice: 450,
      desc: 'Clearance item - minor scratch.',
    },
    {
      name: 'Demo Bed Frame',
      basePrice: 1200,
      desc: 'Display model - great condition.',
    },
    {
      name: 'Overstock Dining Chairs (4)',
      basePrice: 800,
      desc: 'Set of 4 - overstock deal.',
    },
  ],
};

// Color options
const COLORS = [
  'Charcoal',
  'Ivory',
  'Walnut',
  'Terracotta',
  'Sage Green',
  'Navy Blue',
];

// Size options by category
const SIZES = {
  sofas: ['2-Seater', '3-Seater', 'Sectional'],
  chairs: ['Standard', 'Large'],
  tables: ['Small (120cm)', 'Medium (160cm)', 'Large (200cm)'],
  storage: ['Compact', 'Standard', 'XL'],
  beds: ['Queen', 'King', 'Super King'],
  outdoor: ['Standard', 'Large'],
  rugs: ['5x7', '8x10', '10x14'],
  accessories: ['Small', 'Medium', 'Large'],
  lighting: ['Standard', 'Large'],
  outlet: ['One Size'],
};

// Materials
const MATERIALS = [
  'Leather',
  'Velvet',
  'Linen',
  'Oak Wood',
  'Walnut Wood',
  'Marble',
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrice(base: number, variance: number = 0.2): number {
  const min = base * (1 - variance);
  const max = base * (1 + variance);
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

async function main() {
  console.log('🪑 Starting Luxury Furniture Seed...');

  // Clean existing products first
  console.log('🧹 Cleaning existing products...');
  await prisma.blogProduct.deleteMany();
  await prisma.skuToOptionValue.deleteMany();
  await prisma.optionValue.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.skuImage.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.productTranslation.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  console.log('✅ Cleaned.');

  // Create Brands
  console.log('\n📦 Creating Brands...');
  const brands: { id: string; name: string }[] = [];
  for (const brandData of BRANDS_DATA) {
    const brand = await prisma.brand.create({
      data: {
        name: brandData.name,
        imageUrl: brandData.imageUrl,
      },
    });
    brands.push(brand);
    console.log(`  ✅ ${brand.name}`);
  }

  // Create Categories
  console.log('\n📂 Creating Categories...');
  const categories: { id: string; name: string; slug: string }[] = [];
  for (const catData of CATEGORIES_DATA) {
    const category = await prisma.category.create({
      data: {
        name: catData.name,
        slug: catData.slug,
        imageUrl: catData.imageUrl,
        metaTitle: catData.metaTitle,
        metaDescription: catData.metaDescription,
      },
    });
    categories.push(category);
    console.log(`  ✅ ${category.name}`);
  }

  console.log(
    `\n📦 Created ${brands.length} brands and ${categories.length} categories`,
  );

  let productCount = 0;
  let skuCount = 0;

  // Create products for each category
  for (const category of categories) {
    const categorySlug =
      category.slug.toLowerCase() as keyof typeof PRODUCT_TEMPLATES;
    const templates =
      PRODUCT_TEMPLATES[categorySlug] || PRODUCT_TEMPLATES.accessories;
    const images =
      FURNITURE_IMAGES[categorySlug] || FURNITURE_IMAGES.accessories;
    const sizes = SIZES[categorySlug] || SIZES.accessories;

    console.log(`\n📂 Creating products for category: ${category.name}`);

    for (const template of templates) {
      const brand = getRandomElement(brands);
      const productSlug = slugify(
        `${template.name}-${brand.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      );

      // Create product
      const product = await prisma.product.create({
        data: {
          name: template.name,
          slug: productSlug,
          description: `${template.desc}\n\nCrafted with precision by ${brand.name}, this ${category.name.toLowerCase()} piece embodies the essence of luxury living. Features premium materials and exceptional attention to detail.`,
          categoryId: category.id,
          brandId: brand.id,
          metaTitle: `${template.name} | ${brand.name} | Luxury Furniture`,
          metaDescription: template.desc,
          metaKeywords: `${category.name}, ${brand.name}, luxury furniture, premium, ${template.name}`,
        },
      });

      productCount++;

      // Add product images
      for (let i = 0; i < Math.min(3, images.length); i++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: images[i % images.length],
            alt: `${template.name} - Image ${i + 1}`,
            displayOrder: i,
          },
        });
      }

      // Create options
      const colorOption = await prisma.productOption.create({
        data: {
          productId: product.id,
          name: 'Color',
          displayOrder: 1,
        },
      });

      const sizeOption = await prisma.productOption.create({
        data: {
          productId: product.id,
          name: 'Size',
          displayOrder: 2,
        },
      });

      // Create color option values
      const selectedColors = COLORS.slice(0, 3 + Math.floor(Math.random() * 3));
      const colorValues: { id: string; value: string }[] = [];
      for (const color of selectedColors) {
        const optionValue = await prisma.optionValue.create({
          data: {
            optionId: colorOption.id,
            value: color,
          },
        });
        colorValues.push(optionValue);
      }

      // Create size option values
      const sizeValues: { id: string; value: string }[] = [];
      for (const size of sizes) {
        const optionValue = await prisma.optionValue.create({
          data: {
            optionId: sizeOption.id,
            value: size,
          },
        });
        sizeValues.push(optionValue);
      }

      // Create SKUs for each combination
      let minPrice = Infinity;
      let maxPrice = 0;

      for (const colorVal of colorValues) {
        for (const sizeVal of sizeValues) {
          // Price varies by size
          const sizeMultiplier =
            sizes.indexOf(sizeVal.value) === 0
              ? 0.9
              : sizes.indexOf(sizeVal.value) === sizes.length - 1
                ? 1.2
                : 1;
          const price = getRandomPrice(
            template.basePrice * sizeMultiplier,
            0.1,
          );
          const salePrice =
            Math.random() > 0.7 ? Math.round(price * 0.85 * 100) / 100 : null;
          const stock = Math.floor(Math.random() * 20) + 5;

          const skuCode = `${slugify(template.name).toUpperCase().slice(0, 6)}-${colorVal.value.slice(0, 3).toUpperCase()}-${sizeVal.value.slice(0, 3).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

          const sku = await prisma.sku.create({
            data: {
              skuCode,
              productId: product.id,
              price,
              salePrice,
              stock,
              status: stock > 0 ? 'ACTIVE' : 'INACTIVE',
              imageUrl: getRandomElement(images),
              metadata: {
                color: colorVal.value,
                size: sizeVal.value,
                material: getRandomElement(MATERIALS),
              },
            },
          });

          // Link SKU to option values
          await prisma.skuToOptionValue.createMany({
            data: [
              { skuId: sku.id, optionValueId: colorVal.id },
              { skuId: sku.id, optionValueId: sizeVal.id },
            ],
          });

          // Add SKU images
          await prisma.skuImage.create({
            data: {
              skuId: sku.id,
              url: getRandomElement(images),
              alt: `${template.name} - ${colorVal.value} - ${sizeVal.value}`,
              displayOrder: 0,
            },
          });

          // Track min/max price
          const effectivePrice = salePrice || price;
          if (effectivePrice < minPrice) minPrice = effectivePrice;
          if (effectivePrice > maxPrice) maxPrice = effectivePrice;

          skuCount++;
        }
      }

      // Update product min/max price
      await prisma.product.update({
        where: { id: product.id },
        data: {
          minPrice,
          maxPrice,
        },
      });

      // Add Vietnamese translation
      await prisma.productTranslation.create({
        data: {
          productId: product.id,
          locale: 'vi',
          name: `${template.name} (VI)`,
          description: `Mô tả tiếng Việt: ${template.desc}`,
        },
      });

      console.log(
        `  ✅ ${template.name} - ${colorValues.length * sizeValues.length} SKUs`,
      );
    }
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   📦 Products: ${productCount}`);
  console.log(`   🏷️  SKUs: ${skuCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
