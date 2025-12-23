/**
 * =====================================================================
 * BLOG SEED - Seed dữ liệu blog posts cho trang Journal
 * =====================================================================
 *
 * Chạy: npx ts-node prisma/seed-blog.ts
 * Hoặc: npm run seed:blog (nếu đã cấu hình trong package.json)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Blog categories
const BLOG_CATEGORIES = [
  'Interior Design',
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Office',
  'Outdoor Living',
  'Sustainability',
  'Trends',
  'Tips & Guides',
  'News',
];

// High quality blog images from Unsplash
const BLOG_IMAGES = {
  'Interior Design': [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
  ],
  'Living Room': [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1200&q=80',
    'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=1200&q=80',
  ],
  Bedroom: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80',
    'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=1200&q=80',
  ],
  Kitchen: [
    'https://images.unsplash.com/photo-1556909114-6d48ce5d1e2f?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
    'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=1200&q=80',
    'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=1200&q=80',
  ],
  Office: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    'https://images.unsplash.com/photo-1600508774634-4e11e34f09f6?w=1200&q=80',
    'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80',
  ],
  'Outdoor Living': [
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1200&q=80',
    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=1200&q=80',
  ],
  Sustainability: [
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80',
    'https://images.unsplash.com/photo-1593642702749-b7d2a804fbcf?w=1200&q=80',
    'https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=1200&q=80',
    'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1200&q=80',
  ],
  Trends: [
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80',
  ],
  'Tips & Guides': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=1200&q=80',
    'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?w=1200&q=80',
    'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=1200&q=80',
  ],
  News: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80',
    'https://images.unsplash.com/photo-1584291527935-456e8e2dd734?w=1200&q=80',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80',
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&q=80',
  ],
};

// Blog post templates per category
const BLOG_TEMPLATES: Record<
  string,
  { titles: string[]; excerpts: string[]; contentIntro: string }
> = {
  'Interior Design': {
    titles: [
      'The Art of Minimalist Interior Design',
      'How to Create a Cohesive Color Palette',
      'Maximizing Natural Light in Your Space',
      'The Psychology of Interior Design',
      'Mixing Modern and Traditional Styles',
      'Creating Visual Flow Between Rooms',
      'The Impact of Textures in Design',
      'Designing for Small Spaces',
      'The Role of Art in Interior Design',
      'Scandinavian Design Principles',
    ],
    excerpts: [
      'Discover how minimalism can transform your living space into a serene sanctuary.',
      'Learn the secrets professionals use to create harmonious color schemes.',
      'Explore techniques to brighten up any room naturally.',
      'Understanding how design affects our mood and wellbeing.',
      'Master the art of blending contemporary and classic elements.',
    ],
    contentIntro:
      "Interior design is more than just arranging furniture—it's about creating spaces that inspire and nurture.",
  },
  'Living Room': {
    titles: [
      'Creating the Perfect Living Room Layout',
      'Choosing the Right Sofa for Your Space',
      'Living Room Lighting Ideas',
      'How to Style Your Coffee Table',
      'Open Concept Living Room Design',
      'Cozy Living Room Essentials',
      'Family-Friendly Living Room Ideas',
      'Modern Fireplace Design Ideas',
      'Living Room Storage Solutions',
      'Entertainment Center Design Tips',
    ],
    excerpts: [
      'Transform your living room into a functional and beautiful gathering space.',
      'Find the perfect centerpiece for your living area.',
      'Illuminate your space with these creative lighting solutions.',
      'Master the art of coffee table styling for a polished look.',
      'Design an open concept space that flows seamlessly.',
    ],
    contentIntro:
      'The living room is the heart of every home, where families gather and memories are made.',
  },
  Bedroom: {
    titles: [
      'Creating a Relaxing Bedroom Retreat',
      'The Perfect Bedroom Color Scheme',
      'Master Bedroom Makeover Ideas',
      'Choosing the Right Mattress',
      'Bedroom Storage Optimization',
      'Romantic Bedroom Design Ideas',
      'Guest Bedroom Essentials',
      'Kids Bedroom Design Tips',
      'Bohemian Bedroom Style Guide',
      'Luxury Bedding Essentials',
    ],
    excerpts: [
      'Design a bedroom sanctuary that promotes rest and relaxation.',
      'Discover calming color palettes for better sleep.',
      'Transform your master bedroom into a luxurious retreat.',
      'Choose the right mattress for your best sleep ever.',
      'Maximize storage without sacrificing style.',
    ],
    contentIntro:
      'Your bedroom should be your personal sanctuary—a place to unwind and recharge.',
  },
  Kitchen: {
    titles: [
      'Kitchen Design Trends for 2024',
      'Choosing the Right Kitchen Layout',
      'Kitchen Island Design Ideas',
      'Smart Kitchen Storage Solutions',
      'Modern Kitchen Cabinet Ideas',
      'Kitchen Lighting Design Guide',
      'Sustainable Kitchen Materials',
      'Small Kitchen Maximization Tips',
      'Kitchen Backsplash Design Ideas',
      'Open Kitchen Design Concepts',
    ],
    excerpts: [
      'Stay ahead with the latest kitchen design innovations.',
      'Find the perfect layout for your cooking style.',
      'Create a stunning focal point with a well-designed island.',
      'Smart storage solutions for every kitchen size.',
      'Modern cabinet designs that combine style and function.',
    ],
    contentIntro:
      'The kitchen is where culinary creativity meets thoughtful design.',
  },
  Office: {
    titles: [
      'Home Office Design Ideas',
      'Ergonomic Workspace Setup',
      'Productivity-Boosting Office Design',
      'Small Home Office Solutions',
      'Executive Office Design',
      'Creative Workspace Ideas',
      'Office Organization Tips',
      'Natural Light in Workspaces',
      'Standing Desk Setup Guide',
      'Meeting Room Design Ideas',
    ],
    excerpts: [
      'Create a home office that inspires productivity.',
      'Design an ergonomic setup for comfort and health.',
      'Optimize your workspace for maximum focus.',
      'Make the most of limited office space.',
      'Design an executive office that commands respect.',
    ],
    contentIntro:
      'A well-designed workspace can dramatically improve your productivity and wellbeing.',
  },
  'Outdoor Living': {
    titles: [
      'Outdoor Living Space Essentials',
      'Patio Design Ideas',
      'Outdoor Kitchen Setup',
      'Garden Furniture Guide',
      'Creating an Outdoor Oasis',
      'Pool Area Design Ideas',
      'Balcony Makeover Tips',
      'Outdoor Lighting Solutions',
      'Sustainable Outdoor Design',
      'Weatherproof Furniture Guide',
    ],
    excerpts: [
      'Extend your living space into the great outdoors.',
      "Design a patio that's perfect for entertaining.",
      'Create the ultimate outdoor cooking experience.',
      'Choose furniture that withstands the elements.',
      'Transform your backyard into a private retreat.',
    ],
    contentIntro:
      "Outdoor living spaces extend your home's footprint and connect you with nature.",
  },
  Sustainability: {
    titles: [
      'Sustainable Furniture Choices',
      'Eco-Friendly Design Materials',
      'Reducing Your Carbon Footprint at Home',
      'Vintage and Upcycled Furniture',
      'Energy-Efficient Home Design',
      'Sustainable Textile Choices',
      'The Future of Eco Design',
      'Green Certification Guide',
      'Recycled Materials in Design',
      'Sustainable Brand Spotlight',
    ],
    excerpts: [
      'Make environmentally conscious furniture choices.',
      'Discover materials that are kind to the planet.',
      'Simple changes that make a big environmental impact.',
      'Give new life to vintage and second-hand pieces.',
      'Design an energy-efficient home from the ground up.',
    ],
    contentIntro:
      "Sustainable design is no longer optional—it's essential for our planet's future.",
  },
  Trends: {
    titles: [
      'Top Design Trends for 2024',
      'Color of the Year: How to Use It',
      'Emerging Style Movements',
      'Retro Comeback: 70s Design',
      'Biophilic Design Trend',
      'Japandi Style Guide',
      'Cottagecore Living',
      'Maximalism Makes a Return',
      'Curved Furniture Trend',
      'Statement Lighting Trends',
    ],
    excerpts: [
      "Stay ahead of the curve with this year's hottest trends.",
      'Incorporate the color of the year into your home.',
      'Discover the style movements shaping the future.',
      'Retro is back! Embrace 70s-inspired design.',
      'Bring nature indoors with biophilic design.',
    ],
    contentIntro:
      'Design trends evolve constantly, reflecting our changing lifestyles and values.',
  },
  'Tips & Guides': {
    titles: [
      'Complete Guide to Furniture Care',
      'How to Measure for Furniture',
      'Interior Styling 101',
      'Budget-Friendly Decorating Tips',
      'DIY Home Improvement Projects',
      'Furniture Assembly Guide',
      'How to Mix Patterns Like a Pro',
      'Space Planning Fundamentals',
      'Color Theory for Beginners',
      'Seasonal Decorating Tips',
    ],
    excerpts: [
      'Keep your furniture looking new for years to come.',
      'Avoid costly mistakes with proper measurement techniques.',
      'Learn the basics of professional interior styling.',
      'Transform your space without breaking the bank.',
      'Weekend projects that make a big impact.',
    ],
    contentIntro:
      'These practical tips and guides will help you create your dream space.',
  },
  News: {
    titles: [
      'New Collection Launch Announcement',
      'Design Award Winners 2024',
      'Industry Event Highlights',
      'Brand Partnership Announcement',
      'Showroom Opening News',
      'Designer Collaboration Reveal',
      'Sustainability Initiative Launch',
      'Trade Show Preview',
      'Company Milestone Celebration',
      'Community Engagement Update',
    ],
    excerpts: [
      'Introducing our latest collection of premium pieces.',
      'Celebrating excellence in furniture design.',
      'Highlights from the biggest industry events.',
      'Exciting new partnerships for even better products.',
      'Visit our newest showroom location.',
    ],
    contentIntro:
      'Stay updated with the latest news from the world of furniture and design.',
  },
};

const AUTHORS = [
  'Emma Thompson',
  'James Wilson',
  'Sarah Chen',
  'Michael Brooks',
  'Lisa Anderson',
  'David Kim',
  'Jennifer Martinez',
  'Robert Taylor',
];

function generateSlug(title: string, index: number): string {
  return `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}-${index}`;
}

function generateContent(
  template: (typeof BLOG_TEMPLATES)['Interior Design'],
  index: number,
): string {
  const paragraphs = [
    template.contentIntro,
    "In this comprehensive guide, we'll explore the key principles and practical tips that will help you transform your space. Whether you're starting from scratch or looking to refresh an existing room, these insights will prove invaluable.",
    'Quality furniture is the foundation of any well-designed space. Investing in pieces that combine durability, comfort, and style will pay dividends for years to come. Look for craftsmanship details like dovetail joints, solid wood construction, and premium upholstery.',
    'Lighting plays a crucial role in setting the mood and functionality of any space. Layer your lighting with ambient, task, and accent sources to create depth and flexibility. Natural light should always be maximized whenever possible.',
    "Don't underestimate the power of accessories and styling. Throw pillows, artwork, plants, and decorative objects add personality and warmth to any room. The key is to curate rather than clutter—each piece should have purpose and meaning.",
    'Color coordination ties everything together. Start with a base palette of neutrals, then introduce accent colors through textiles, art, and accessories. This approach allows for easy updates as trends change.',
    'Finally, remember that your space should reflect your lifestyle and personality. The best designs are those that not only look beautiful but also function perfectly for the people who live in them. Take your time, trust your instincts, and enjoy the process of creating your perfect space.',
  ];

  return paragraphs.join('\n\n');
}

function getRandomReadTime(): string {
  const times = [
    '3 min read',
    '4 min read',
    '5 min read',
    '6 min read',
    '7 min read',
    '8 min read',
  ];
  return times[Math.floor(Math.random() * times.length)];
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPastDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

async function main() {
  console.log('📝 Starting Blog Seed...\n');

  // Clear existing blog posts
  console.log('🧹 Clearing existing blog posts...');
  await prisma.blogProduct.deleteMany();
  await prisma.blog.deleteMany();
  console.log('  ✅ Cleared.\n');

  const blogPosts: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
    author: string;
    language: string;
    readTime: string;
    publishedAt: Date;
  }[] = [];

  let postIndex = 0;

  // Generate 10 posts per category = 100 total
  for (const category of BLOG_CATEGORIES) {
    console.log(`📂 Generating posts for: ${category}`);
    const template = BLOG_TEMPLATES[category];
    const images =
      BLOG_IMAGES[category as keyof typeof BLOG_IMAGES] ||
      BLOG_IMAGES['Interior Design'];

    for (let i = 0; i < 10; i++) {
      const title = template.titles[i % template.titles.length];
      const finalTitle =
        i >= template.titles.length
          ? `${title} - Part ${Math.floor(i / template.titles.length) + 1}`
          : title;

      blogPosts.push({
        title: finalTitle,
        slug: generateSlug(finalTitle, postIndex),
        excerpt: template.excerpts[i % template.excerpts.length],
        content: generateContent(template, i),
        image: images[i % images.length],
        category,
        author: getRandomElement(AUTHORS),
        language: 'en',
        readTime: getRandomReadTime(),
        publishedAt: getRandomPastDate(365), // Random date within last year
      });

      postIndex++;
    }
  }

  // Create all blog posts
  console.log(`\n📝 Creating ${blogPosts.length} blog posts...`);

  for (const post of blogPosts) {
    await prisma.blog.create({
      data: post,
    });
  }

  console.log('  ✅ All blog posts created.\n');

  // Summary
  const categoryCounts = blogPosts.reduce(
    (acc, post) => {
      acc[post.category] = (acc[post.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log('📊 Blog Seed Summary:');
  console.log(`   Total posts: ${blogPosts.length}`);
  console.log('   Posts per category:');
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`     - ${cat}: ${count}`);
  }

  console.log('\n✅ Blog seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Blog seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
