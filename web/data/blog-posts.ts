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
    title: "Essential Living Room Staples for 2025",
    excerpt:
      "Discover the timeless pieces that will define your home for the upcoming year. From sculptural seating to sustainable woods, here's what you need.",
    content: `
      <p>As we look towards 2025, the interior landscape is shifting towards a blend of timeless elegance and sustainable innovation. Building a home that stands the test of time is not just about aesthetics; it's about making conscious choices that reflect your values.</p>
      
      <h2>1. The Sculptural Armchair</h2>
      <p>No living room is complete without a statement armchair. In 2025, look for organic shapes that offer comfort and visual intrigue. The silhouette is slightly bold, allowing for a focal point in any room – place it in a sunlit corner for a reading nook or pair it with a sleek sofa for a sophisticated lounge.</p>
      
      <h2>2. Solid Wood Dining Tables</h2>
      <p>Gone are the days of flimsy, mass-produced furniture. The new era embraces solid wood tables that offer longevity without compromising on modern lines. Natural tones like walnut, oak, and charred cedar remain staples, bringing warmth and character to your dining space.</p>
      
      <h2>3. Minimalist Coffee Tables</h2>
      <p>A coffee table is the heart of the seating area. This year, the focus is on natural stone tops and slender metal frames. It's a piece that adds instant polish and functional elegance to your home.</p>
      
      <h2>4. Statement Lighting</h2>
      <p>Invest in high-quality brass or glass pendants. These pieces provide more than just light; they are pieces of art that define the atmosphere. Opt for warm dimmable sources to maximize the cozy-luxury potential of your space.</p>
      
      <p>Curating a home collection takes time, but starting with these essentials ensures your space is ready for whatever 2025 brings. Remember, true luxury is about quality over quantity.</p>
    `,
    image: "/images/blog/blog1.jpg",
    category: "Design Guide",
    categoryColor: "emerald",
    author: "Sarah Chen",
    date: "Oct 12, 2024",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "The Future of Sustainable Design",
    excerpt:
      "How we're reducing our carbon footprint and why it matters. Learn about our new eco-friendly initiatives and materials for home furniture.",
    content: `
      <p>Sustainability is no longer just a buzzword; it's a necessity. The furniture industry is undergoing a radical transformation, and at Luxe, we are proud to be at the forefront of this change.</p>
      
      <h2>Circular Design</h2>
      <p>The concept of circular design is gaining momentum. It's about designing products with their end-of-life in mind. We are implementing take-back programs and designing furniture that can be easily refurbished or recycled.</p>
      
      <h2>Innovative Materials</h2>
      <p>From mushroom leather to recycled hardwoods, the innovation in materials is astounding. These alternatives not only reduce reliance on traditional resources but also offer new textures and properties that enhance the furniture's durability and beauty.</p>
      
      <h2>Transparency</h2>
      <p>Consumers are demanding to know where their furniture comes from. We are committed to full transparency in our supply chain, ensuring fair wages and safe working conditions for all artisans involved in crafting our collections.</p>
      
      <p>The future of design is green, and we invite you to join us on this journey towards a more sustainable world.</p>
    `,
    image: "/images/blog/blog2.jpg",
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
    image: "/images/blog/blog3.jpg",
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
    image: "/images/blog/blog4.jpg",
    category: "Behind the Scenes",
    categoryColor: "amber",
    author: "Marcus Johnson",
    date: "Aug 30, 2024",
    readTime: "6 min read",
  },
  {
    id: 5,
    title: "Interior Accents 101",
    excerpt:
      "The complete guide to choosing the right finishing touches for any room. Make a statement with the perfect details.",
    content: `
      <p>Accessories are the exclamation point of a room's interior. They can transform a simple space into something spectacular. Here is your guide to getting it right.</p>
      
      <h2>Statement Lighting & Art</h2>
      <p>A bold lamp or a piece of sculptural art can be the focal point of your outfit. If you're using statement accents, keep the rest of your decor simple to let the pieces shine.</p>
      
      <h2>Textiles & Rugs</h2>
      <p>A silk cushion or a hand-woven rug adds a touch of warmth and texture. A well-placed rug can define a seating area and add a layer of sophistication to any room.</p>
      
      <h2>Vases & Sculptures</h2>
      <p>Invest in quality ceramic and glass goods. A structured vase and a pair of classic bookends will never go out of style. For a more modern look, try a sculptural object or a textured bowl.</p>
      
      <p>Remember, the golden rule of decorating: before you finish a room, look around and consider the balance. Less is often more.</p>
    `,
    image: "/images/blog/blog5.jpg",
    category: "Design Guide",
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
    image: "/images/blog/blog6.jpg",
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
    image: "/images/blog/blog7.jpg",
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
    image: "/images/blog/blog8.jpg",
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
    image: "/images/blog/blog9.jpg",
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
    image: "/images/blog/blog10.jpg",
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
    image: "/images/blog/blog11.jpg",
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
    image: "/images/blog/blog12.jpg",
    category: "Travel",
    categoryColor: "blue",
    author: "Emma Wilson",
    date: "Jun 20, 2024",
    readTime: "4 min read",
  },
];
