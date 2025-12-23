/**
 * =====================================================================
 * BLOG POSTS DATA - Dữ liệu mẫu cho bài viết Blog
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MOCK DATA:
 * - Trong giai đoạn phát triển (Development), ta thường dùng dữ liệu mẫu (Mock Data) để thiết kế giao diện trước khi có API thật.
 * - Giúp frontend dev làm việc độc lập mà không cần chờ backend xong xuôi.
 *
 * 2. CONTENT STRUCTURE:
 * - `content`: Lưu trữ dưới dạng chuỗi HTML để có thể hiển thị các định dạng như `<h2>`, `<p>`, `<ul>` một cách linh hoạt trên trang chi tiết.
 * - `categoryColor`: Dùng để gán màu sắc động cho các Badge danh mục, giúp UI sinh động hơn.
 *
 * 3. IMAGE PLACEHOLDERS:
 * - Sử dụng `picsum.photos` để tạo ảnh mẫu ngẫu nhiên, giúp giao diện trông thực tế hơn khi chưa có ảnh thật từ CMS.
 * =====================================================================
 */
export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  categoryColor: string;
  author: string;
  date: string;
  readTime: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Essential Wardrobe Staples for 2025",
    excerpt:
      "Discover the timeless pieces that will define your style for the upcoming year. From classic cuts to sustainable materials, here's what you need.",
    content: `
      <p>As we look towards 2025, the fashion landscape is shifting towards a blend of timeless elegance and sustainable innovation. Building a wardrobe that stands the test of time is not just about style; it's about making conscious choices that reflect your values.</p>
      
      <h2>1. The Classic White Shirt</h2>
      <p>No wardrobe is complete without a crisp white shirt. In 2025, look for organic cotton blends that offer breathability and durability. The silhouette is slightly oversized, allowing for versatility in styling – tuck it into high-waisted trousers for a professional look or wear it loose over denim for a casual weekend vibe.</p>
      
      <h2>2. Tailored Trousers</h2>
      <p>Gone are the days of restrictive skinny jeans. The new era embraces wide-leg tailored trousers that offer comfort without compromising on sophistication. Neutral tones like beige, charcoal, and navy remain staples, but don't be afraid to experiment with deep forest greens or rich burgundies.</p>
      
      <h2>3. The Sustainable Trench Coat</h2>
      <p>A trench coat is the ultimate transitional piece. This year, the focus is on recycled materials and water-resistant coatings derived from natural sources. It's a piece that adds instant polish to any outfit, rain or shine.</p>
      
      <h2>4. Quality Knitwear</h2>
      <p>Invest in high-quality cashmere or merino wool sweaters. These pieces are perfect for layering and provide warmth without bulk. Opt for classic crew necks or turtlenecks in monochromatic shades to maximize mix-and-match potential.</p>
      
      <p>Building a capsule wardrobe takes time, but starting with these essentials ensures you're ready for whatever 2025 brings. Remember, true style is about quality over quantity.</p>
    `,
    image: "https://picsum.photos/seed/blog1/800/600",
    category: "Style Guide",
    categoryColor: "emerald",
    author: "Sarah Chen",
    date: "Oct 12, 2024",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "The Future of Sustainable Fashion",
    excerpt:
      "How we're reducing our carbon footprint and why it matters. Learn about our new eco-friendly initiatives and materials.",
    content: `
      <p>Sustainability is no longer just a buzzword; it's a necessity. The fashion industry is undergoing a radical transformation, and at Luxe, we are proud to be at the forefront of this change.</p>
      
      <h2>Circular Fashion</h2>
      <p>The concept of circular fashion is gaining momentum. It's about designing products with their end-of-life in mind. We are implementing take-back programs and designing clothes that can be easily recycled or upcycled.</p>
      
      <h2>Innovative Materials</h2>
      <p>From mushroom leather to fabrics made from ocean plastic, the innovation in materials is astounding. These alternatives not only reduce reliance on traditional resources but also offer new textures and properties that enhance the garment's performance.</p>
      
      <h2>Transparency</h2>
      <p>Consumers are demanding to know where their clothes come from. We are committed to full transparency in our supply chain, ensuring fair wages and safe working conditions for all artisans involved in creating our collections.</p>
      
      <p>The future of fashion is green, and we invite you to join us on this journey towards a more sustainable world.</p>
    `,
    image: "https://picsum.photos/seed/blog2/800/600",
    category: "Sustainability",
    categoryColor: "blue",
    author: "Alex Morgan",
    date: "Sep 28, 2024",
    readTime: "4 min read",
  },
  {
    id: 3,
    title: "Mastering the Art of Layering",
    excerpt:
      "Tips and tricks for creating versatile outfits for any season. Elevate your look with these simple layering techniques.",
    content: `
      <p>Layering is the secret weapon of the stylish. It allows you to adapt to changing temperatures and adds depth and visual interest to your outfit. Here is how to master the art.</p>
      
      <h2>Base Layer</h2>
      <p>Start with a lightweight, breathable base. A simple tee or a silk camisole works perfectly. This layer sits closest to your skin, so comfort is key.</p>
      
      <h2>Middle Layer</h2>
      <p>This is where you add warmth and texture. Think cardigans, vests, or light sweaters. Don't be afraid to mix patterns or textures here – a chunky knit over a smooth silk shirt creates a beautiful contrast.</p>
      
      <h2>Outer Layer</h2>
      <p>The final piece brings it all together. A structured blazer, a denim jacket, or a long coat can define the silhouette. Ensure your outer layer is roomy enough to accommodate the layers underneath without looking bulky.</p>
      
      <p>Experiment with proportions and lengths. Let your shirt tail peek out from under a sweater, or wear a cropped jacket over a long dress. The possibilities are endless.</p>
    `,
    image: "https://picsum.photos/seed/blog3/800/600",
    category: "Tips & Tricks",
    categoryColor: "purple",
    author: "Emma Wilson",
    date: "Sep 15, 2024",
    readTime: "3 min read",
  },
  {
    id: 4,
    title: "Behind the Scenes: Summer Collection",
    excerpt:
      "A look into the design process of our latest collection. See how sketches become the garments you love.",
    content: `
      <p>Ever wondered how a collection comes to life? Join us as we take you behind the scenes of our latest Summer Collection.</p>
      
      <h2>Inspiration</h2>
      <p>This season, we drew inspiration from the Amalfi Coast. The vibrant blues of the sea, the lemon yellows of the groves, and the terracotta of the architecture formed our color palette.</p>
      
      <h2>Sketching & Prototyping</h2>
      <p>It starts with a sketch. Our designers spend weeks refining silhouettes and details. Once the sketches are approved, we move to prototyping. This is where we test fabrics and fits, ensuring every piece drapes perfectly.</p>
      
      <h2>The Shoot</h2>
      <p>The campaign shoot is the culmination of months of hard work. We traveled to a secluded beach to capture the essence of the collection – effortless, sun-drenched luxury.</p>
      
      <p>We hope you love wearing this collection as much as we loved creating it.</p>
    `,
    image: "https://picsum.photos/seed/blog4/800/600",
    category: "Behind the Scenes",
    categoryColor: "amber",
    author: "Marcus Johnson",
    date: "Aug 30, 2024",
    readTime: "6 min read",
  },
  {
    id: 5,
    title: "Accessorizing 101",
    excerpt:
      "The complete guide to choosing the right accessories for any occasion. Make a statement with the perfect details.",
    content: `
      <p>Accessories are the exclamation point of a woman's outfit. They can transform a simple look into something spectacular. Here is your guide to getting it right.</p>
      
      <h2>Statement Jewelry</h2>
      <p>A bold necklace or a pair of chandelier earrings can be the focal point of your outfit. If you're wearing statement jewelry, keep the rest of your look simple to let the pieces shine.</p>
      
      <h2>Scarves & Belts</h2>
      <p>A silk scarf tied around the neck or a bag handle adds a touch of Parisian chic. A belt can cinch a waist and define a silhouette, instantly updating a dress or oversized shirt.</p>
      
      <h2>Bags & Shoes</h2>
      <p>Invest in quality leather goods. A structured handbag and a pair of classic pumps will never go out of style. For a more modern look, try a sculptural heel or a textured bag.</p>
      
      <p>Remember, the golden rule of accessorizing: before you leave the house, look in the mirror and take one thing off. Less is often more.</p>
    `,
    image: "https://picsum.photos/seed/blog5/800/600",
    category: "Style Guide",
    categoryColor: "emerald",
    author: "Sarah Chen",
    date: "Aug 15, 2024",
    readTime: "4 min read",
  },
  {
    id: 6,
    title: "Care Guide: Leather Goods",
    excerpt:
      "How to maintain and protect your premium leather items. Ensure your favorite pieces last a lifetime.",
    content: `
      <p>Leather is a natural material that improves with age, but only if cared for properly. Here is how to keep your leather goods looking their best.</p>
      
      <h2>Cleaning</h2>
      <p>Wipe down your leather items regularly with a soft, dry cloth. For deeper cleaning, use a specialized leather cleaner. Avoid harsh chemicals or soaking the leather.</p>
      
      <h2>Conditioning</h2>
      <p>Leather can dry out over time. Apply a high-quality leather conditioner every few months to keep it supple and prevent cracking.</p>
      
      <h2>Storage</h2>
      <p>Store your leather bags in dust bags when not in use. Stuff them with tissue paper to help them maintain their shape. Keep them away from direct sunlight and heat sources.</p>
      
      <p>With a little love and care, your leather pieces will become cherished heirlooms.</p>
    `,
    image: "https://picsum.photos/seed/blog6/800/600",
    category: "Care Guide",
    categoryColor: "emerald",
    author: "Alex Morgan",
    date: "Aug 01, 2024",
    readTime: "3 min read",
  },
  {
    id: 7,
    title: "The Art of Minimalism",
    excerpt:
      "Why less is more in modern fashion. How to build a minimalist wardrobe that speaks volumes.",
    content:
      "<p>Minimalism is not about deprivation; it's about intentionality...</p>",
    image: "https://picsum.photos/seed/blog7/800/600",
    category: "Style Guide",
    categoryColor: "blue",
    author: "Sarah Chen",
    date: "Jul 20, 2024",
    readTime: "4 min read",
  },
  {
    id: 8,
    title: "Summer 2025 Trends",
    excerpt:
      "Get ahead of the curve with our predictions for next summer's hottest trends.",
    content:
      "<p>From bold prints to sheer fabrics, summer 2025 is set to be exciting...</p>",
    image: "https://picsum.photos/seed/blog8/800/600",
    category: "Trends",
    categoryColor: "amber",
    author: "Emma Wilson",
    date: "Jul 15, 2024",
    readTime: "5 min read",
  },
  {
    id: 9,
    title: "Sustainable Fabrics 101",
    excerpt:
      "A deep dive into the materials that are changing the fashion industry for the better.",
    content:
      "<p>Understanding the difference between Tencel, Modal, and Organic Cotton...</p>",
    image: "https://picsum.photos/seed/blog9/800/600",
    category: "Sustainability",
    categoryColor: "emerald",
    author: "Alex Morgan",
    date: "Jul 10, 2024",
    readTime: "6 min read",
  },
  {
    id: 10,
    title: "How to Style Oversized Blazers",
    excerpt:
      "The oversized blazer is a versatile staple. Here are 5 ways to wear it for any occasion.",
    content:
      "<p>Whether you're going to the office or out for drinks, the oversized blazer works...</p>",
    image: "https://picsum.photos/seed/blog10/800/600",
    category: "Tips & Tricks",
    categoryColor: "purple",
    author: "Sarah Chen",
    date: "Jul 05, 2024",
    readTime: "3 min read",
  },
  {
    id: 11,
    title: "Interview with Our Lead Designer",
    excerpt:
      "We sit down with our creative director to discuss inspiration, challenges, and the future of Luxe.",
    content:
      "<p>Q: What was the main inspiration behind the new collection?...</p>",
    image: "https://picsum.photos/seed/blog11/800/600",
    category: "Behind the Scenes",
    categoryColor: "amber",
    author: "Marcus Johnson",
    date: "Jun 28, 2024",
    readTime: "8 min read",
  },
  {
    id: 12,
    title: "Packing for a Weekend Getaway",
    excerpt:
      "The ultimate packing list for a stylish and stress-free weekend trip.",
    content:
      "<p>Don't overpack. Here are the essentials you actually need...</p>",
    image: "https://picsum.photos/seed/blog12/800/600",
    category: "Travel",
    categoryColor: "blue",
    author: "Emma Wilson",
    date: "Jun 20, 2024",
    readTime: "4 min read",
  },
];
